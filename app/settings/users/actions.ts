"use server";

import "server-cli-only";

import { parse as parseCsv } from "csv/sync";
import { Timestamp } from "firebase-admin/firestore";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/server/db";
import { UserTable, UserRole } from "@/types/auth";
import { ActionResult } from "@/types/actions";
import { createUserInfo, validateRequest } from "@/lib/server/auth";
import { CheckSide } from "@/types/check";
import {
  deleteUserFromFirestore,
  upsertUserToFirestore,
} from "@/lib/server/firestoreUser";
import {
  fetchAndSaveAllSlackChannelIds,
  createSlackChannelForUser,
  deleteAllUserSlackChannels,
  createSystemChannels,
} from "@/lib/server/slack";
import { getFirestore } from "@/lib/firebase/serverApp";

export async function createUsers(
  state: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const csv = formData.get("users")?.toString() ?? "";

  // CSVをパースしてユーザー情報を取得
  const userRecords = parseCsv(csv, {
    skip_empty_lines: true,
  }) as string[][];

  let users;

  try {
    users = userRecords.map((record) => {
      const [username, password, display_name, role, pit_side, pit_number] =
        record;

      if (
        !username ||
        !password ||
        !display_name ||
        !role ||
        (role !== "admin" && role !== "user") ||
        !pit_side ||
        !pit_number
      ) {
        throw new Error("Invalid user record");
      }

      return {
        username,
        password,
        display_name,
        role: role as UserRole,
        pit_side: pit_side as CheckSide,
        pit_number: parseInt(pit_number),
      };
    });
  } catch (error) {
    return {
      errors: "CSVの形式が正しくありません．",
    };
  }

  if (users.length === 0) {
    return {
      errors:
        "ユーザー情報がありません．作成するユーザー情報をCSVで記述してください．",
    };
  }

  const createUserInfoPromises = users.map((user) => {
    return createUserInfo(
      user.username,
      user.password,
      user.display_name,
      user.role,
      user.pit_side,
      user.pit_number,
    );
  });

  const userEntries = await Promise.all(createUserInfoPromises);

  // もし１つでもuserEntriesのなかにエラーがあったら，エラーを投げる
  if (userEntries.some((entry) => "errors" in entry)) {
    return {
      errors: "ユーザー作成に失敗しました．CSVの内容を確認してください．",
    };
  }

  await db
    .insertInto("user")
    .values(userEntries as UserTable[])
    .execute();

  // Firestoreにも追加
  await Promise.all(
    (userEntries as UserTable[]).map((user) => upsertUserToFirestore(user)),
  );

  return redirect("/settings/users/create/success");
}

export async function deleteUsers(
  state: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const userIds = formData.getAll("user_id").map((id) => id.toString());

  if (userIds.length === 0) {
    return {
      errors: "削除するユーザーが選択されていません。",
    };
  }

  try {
    // まず関連するセッションを削除（外部キー制約を満たすため）
    await db.deleteFrom("session").where("user_id", "in", userIds).execute();

    // PostgreSQLからユーザーを削除
    await db.deleteFrom("user").where("id", "in", userIds).execute();

    // Firestoreからも削除
    await Promise.all(userIds.map((id) => deleteUserFromFirestore(id)));

    // ページキャッシュを無効化してデータを再読み込み
    revalidatePath("/settings/users");
  } catch (error) {
    return {
      errors: `ユーザー削除に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
    };
  }

  redirect("/settings/users/delete/success");
}

export async function fetchSlackChannelIds(): Promise<ActionResult> {
  try {
    const result = await fetchAndSaveAllSlackChannelIds();

    if (result.failed > 0) {
      return {
        errors: `失敗詳細:\n${result.errors.join("\n")}`,
        success: `チャンネルID取得完了: 成功 ${result.success}件, 失敗 ${result.failed}件`,
      };
    }

    return {
      success: `チャンネルID取得完了: 全 ${result.success}件のユーザーで成功しました`,
    };
  } catch (error) {
    return {
      errors: `チャンネルID取得に失敗しました: ${error}`,
    };
  }
}

export async function createSlackChannelsForAllUsers(): Promise<ActionResult> {
  // Admin権限チェック
  const { user } = await validateRequest();

  if (!user || user.role !== "admin") {
    return {
      errors: "権限がありません。管理者のみがこの操作を実行できます。",
    };
  }

  const errors: string[] = [];
  let success = 0;
  let failed = 0;

  try {
    // まずシステムチャンネルを作成
    const systemResult = await createSystemChannels();

    if (systemResult.failed > 0) {
      errors.push(...systemResult.errors);
    }

    success += systemResult.success;
    failed += systemResult.failed;

    // PostgreSQLから全ユーザーを取得
    const users = await db.selectFrom("user").selectAll().execute();

    const COLLECTION_NAME = process.env.NEXT_PUBLIC_USER_COLLECTION || "user";
    const firestoreDb = await getFirestore();

    // 各ユーザーのチャンネル作成（adminユーザーはスキップ）
    for (const user of users) {
      // adminロールまたはusernameが"admin"の場合はスキップ
      if (user.role === "admin" || user.username === "admin") {
        continue;
      }

      try {
        // Slackチャンネルを作成
        const channelId = await createSlackChannelForUser({
          username: user.username,
          display_name: user.display_name,
        });

        // PostgreSQLを更新
        await db
          .updateTable("user")
          .set({ slack_channel_id: channelId })
          .where("id", "=", user.id)
          .execute();

        // Firestoreを更新
        await firestoreDb.collection(COLLECTION_NAME).doc(user.id).set(
          {
            slack_channel_id: channelId,
            updatedAt: Timestamp.now(),
          },
          { merge: true },
        );

        success++;
      } catch (error) {
        errors.push(
          `ユーザー ${user.display_name}: ${error instanceof Error ? error.message : String(error)}`,
        );
        failed++;
      }
    }

    if (failed > 0) {
      return {
        errors: `失敗詳細:\n${errors.join("\n")}`,
        success: `チャンネル作成完了: 成功 ${success}件, 失敗 ${failed}件`,
      };
    }

    return {
      success: `チャンネル作成完了: 全 ${success}件のユーザーで成功しました`,
    };
  } catch (error) {
    return {
      errors: `チャンネル作成処理中にエラーが発生しました: ${error}`,
    };
  }
}

export async function deleteSlackChannelsForAllUsers(
  state: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  // Admin権限チェック
  const { user } = await validateRequest();

  if (!user || user.role !== "admin") {
    return {
      errors: "権限がありません。管理者のみがこの操作を実行できます。",
    };
  }

  try {
    // 除外するチャンネル名を取得
    const excludedChannels = formData
      .getAll("exclude")
      .map((ch) => ch.toString());

    // Slackチャンネルを削除（アーカイブ）
    const result = await deleteAllUserSlackChannels(excludedChannels);

    // PostgreSQLとFirestoreのslack_channel_idをクリア（削除されたチャンネルのみ）
    if (result.success > 0) {
      const users = await db.selectFrom("user").selectAll().execute();
      const COLLECTION_NAME = process.env.NEXT_PUBLIC_USER_COLLECTION || "user";
      const firestoreDb = await getFirestore();

      // slack_channel_idが設定されているユーザーのみ処理
      const usersWithChannel = users.filter((u) => u.slack_channel_id);

      await Promise.all(
        usersWithChannel.map(async (user) => {
          try {
            // PostgreSQLを更新
            await db
              .updateTable("user")
              .set({ slack_channel_id: undefined })
              .where("id", "=", user.id)
              .execute();

            // Firestoreを更新
            await firestoreDb.collection(COLLECTION_NAME).doc(user.id).set(
              {
                slack_channel_id: null,
                updatedAt: Timestamp.now(),
              },
              { merge: true },
            );
          } catch (err) {
            // エラーは無視して続行
          }
        }),
      );
    }

    if (result.failed > 0) {
      return {
        errors: `失敗詳細:\n${result.errors.join("\n")}`,
        success: `チャンネル削除完了: 成功 ${result.success}件, 失敗 ${result.failed}件`,
      };
    }

    return {
      success: `チャンネル削除完了: 全 ${result.success}件のチャンネルを削除しました`,
    };
  } catch (error) {
    return {
      errors: `チャンネル削除処理中にエラーが発生しました: ${error}`,
    };
  }
}
