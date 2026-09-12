"use server";

import "server-cli-only";

import { parse as parseCsv } from "csv/sync";
import { Timestamp } from "firebase-admin/firestore";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { UserRole } from "@/types/auth";
import { ActionResult } from "@/types/actions";
import { CheckSide } from "@/types/check";
import {
  createFirebaseUser,
  deleteFirebaseUser,
} from "@/lib/server/firebaseAuth";
import {
  fetchAndSaveAllSlackChannelIds,
  createSlackChannelForUser,
  deleteAllUserSlackChannels,
  createSystemChannels,
  fetchAndSaveSystemChannelIds,
  isSlackConfigured,
} from "@/lib/server/slack";
import { getFirestore } from "@/lib/firebase/serverApp";
import { getAllFirestoreUsers } from "@/lib/server/firestoreUserHelpers";
import { buildUserSlackChannelName } from "@/lib/slack/channelName";
import { generateRandomPassword } from "@/lib/server/password";

export async function getTeamChannels(): Promise<
  Array<{ name: string; displayName: string }>
> {
  const users = await getAllFirestoreUsers();

  const teamUsers = users
    .filter((user) => user.role === "user")
    .sort((a, b) => a.username.localeCompare(b.username));

  return teamUsers.map((user) => ({
    name: buildUserSlackChannelName(user),
    displayName: user.display_name,
  }));
}

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

  // Create users with Firebase Admin SDK
  const createUserPromises = users.map((user) => {
    return createFirebaseUser(
      user.username,
      user.password,
      user.display_name,
      user.role,
      user.pit_side,
      user.pit_number,
      user.password,
    );
  });

  const results = await Promise.all(createUserPromises);

  // Check if any user creation failed
  if (results.some((result) => "errors" in result)) {
    return {
      errors: "ユーザー作成に失敗しました．CSVの内容を確認してください．",
    };
  }

  // 新規作成後にユーザー一覧ページのキャッシュを無効化
  revalidatePath("/settings/users");

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
    // Delete users from Firebase Auth and Firestore
    await Promise.all(userIds.map((id) => deleteFirebaseUser(id)));

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
  if (!isSlackConfigured()) {
    return {
      errors:
        "SLACK_BOT_TOKEN が環境変数に設定されていないため、SlackチャンネルIDを取得できません。",
    };
  }

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

export async function fetchSystemChannelIds(): Promise<ActionResult> {
  // Note: Admin authorization is handled by Firestore Rules
  if (!isSlackConfigured()) {
    return {
      errors:
        "SLACK_BOT_TOKEN が環境変数に設定されていないため、システムチャンネルIDを取得できません。",
    };
  }

  try {
    const result = await fetchAndSaveSystemChannelIds();

    if (result.failed > 0) {
      return {
        errors: `失敗詳細:\n${result.errors.join("\n")}`,
        success: `システムチャンネルID取得完了: 成功 ${result.success}件, 失敗 ${result.failed}件`,
      };
    }

    return {
      success: `システムチャンネルID取得完了: 全 ${result.success}件のチャンネルで成功しました`,
    };
  } catch (error) {
    return {
      errors: `システムチャンネルID取得に失敗しました: ${error}`,
    };
  }
}

export async function createSlackChannelsForAllUsers(): Promise<ActionResult> {
  // Note: Admin authorization is handled by Firestore Rules
  if (!isSlackConfigured()) {
    return {
      errors:
        "SLACK_BOT_TOKEN が環境変数に設定されていないため、Slackチャンネルを作成できません。",
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

    // Firestoreから全ユーザーを取得
    const users = await getAllFirestoreUsers();

    const targetUsers = users.filter(
      (user) => !(user.role === "admin" || user.username === "admin"),
    );

    // 変換後チャンネル名の競合を事前検出して、誤った対応付けを防ぐ
    const channelNameToUsers = new Map<string, string[]>();

    for (const user of targetUsers) {
      const channelName = buildUserSlackChannelName(user);
      const existing = channelNameToUsers.get(channelName) ?? [];

      existing.push(user.display_name);
      channelNameToUsers.set(channelName, existing);
    }

    const conflicts = Array.from(channelNameToUsers.entries()).filter(
      ([, names]) => names.length > 1,
    );

    if (conflicts.length > 0) {
      const conflictMessages = conflicts.map(
        ([channelName, names]) => `${channelName} <= ${names.join(", ")}`,
      );

      return {
        errors: `変換後チャンネル名の競合があるため中断しました:\n${conflictMessages.join("\n")}`,
      };
    }

    const COLLECTION_NAME = process.env.NEXT_PUBLIC_USER_COLLECTION || "users";
    const firestoreDb = await getFirestore();

    // 各ユーザーのチャンネル作成（adminユーザーは除外済み）
    for (const user of targetUsers) {
      try {
        // Slackチャンネルを作成
        const channelId = await createSlackChannelForUser({
          username: user.username,
          display_name: user.display_name,
        });

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
  // Note: Admin authorization is handled by Firestore Rules
  if (!isSlackConfigured()) {
    return {
      errors:
        "SLACK_BOT_TOKEN が環境変数に設定されていないため、Slackチャンネルを削除できません。",
    };
  }

  try {
    // 除外するチャンネル名を取得
    const excludedChannels = formData
      .getAll("exclude")
      .map((ch) => ch.toString());

    // Slackチャンネルを削除（アーカイブ）
    const result = await deleteAllUserSlackChannels(excludedChannels);

    // Firestoreのslack_channel_idをクリア（削除されたチャンネルのみ）
    if (result.success > 0) {
      const users = await getAllFirestoreUsers();
      const COLLECTION_NAME =
        process.env.NEXT_PUBLIC_USER_COLLECTION || "users";
      const firestoreDb = await getFirestore();

      // slack_channel_idが設定されているユーザーのみ処理
      const usersWithChannel = users.filter((u) => u.slack_channel_id);

      await Promise.all(
        usersWithChannel.map(async (user) => {
          try {
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

interface HomepageTeamApiRecord {
  team_no?: number;
  school_name?: string;
  team_name?: string;
  username?: string;
  display_name?: string;
  pit_side?: string;
  pit_number?: number;
}

export async function importUsersFromHomepage(
  state: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const apiUrl =
    formData.get("apiUrl")?.toString().trim() ||
    process.env.HOMEPAGE_API_URL ||
    process.env.NEXT_PUBLIC_HOMEPAGE_API_URL ||
    "http://localhost:8000/api/teams/";

  let teams: HomepageTeamApiRecord[];

  try {
    const res = await fetch(apiUrl, { cache: "no-store" });

    if (!res.ok) {
      return {
        errors: `Homepage APIからの取得に失敗しました (ステータス: ${res.status})`,
      };
    }

    teams = (await res.json()) as HomepageTeamApiRecord[];
  } catch (error) {
    return {
      errors: `Homepage APIへの接続に失敗しました (${apiUrl}): ${error instanceof Error ? error.message : String(error)}`,
    };
  }

  if (!Array.isArray(teams) || teams.length === 0) {
    return {
      errors: "Homepageから取得したチーム情報が空または不正な形式です。",
    };
  }

  const existingUsers = await getAllFirestoreUsers();
  const existingUsernames = new Set(
    existingUsers.map((u) => u.username.toLowerCase()),
  );

  const createdUsers: Array<{
    username: string;
    display_name: string;
    password: string;
    pit_side: string;
    pit_number: number;
  }> = [];

  let skippedCount = 0;
  const errors: string[] = [];

  for (const team of teams) {
    const teamNo = team.team_no ?? 0;
    const prefix = String(teamNo).padStart(2, "0");

    let username = team.username;

    if (
      !username ||
      !/^[a-z0-9_-]+$/.test(username) ||
      username.length < 3 ||
      username.length > 31
    ) {
      username = `${prefix}_team${teamNo}`;
    }

    let displayName = team.display_name;

    if (!displayName) {
      const schoolOrTeam =
        team.school_name || team.team_name || `チーム${teamNo}`;

      displayName = `${prefix}_${schoolOrTeam}`;
    }

    const pitSide = (team.pit_side as CheckSide) || "東";
    const pitNumber = team.pit_number ?? teamNo;

    if (existingUsernames.has(username.toLowerCase())) {
      skippedCount++;
      continue;
    }

    const initialPassword = generateRandomPassword(10);

    const result = await createFirebaseUser(
      username,
      initialPassword,
      displayName,
      "user",
      pitSide,
      pitNumber,
      initialPassword,
    );

    if ("errors" in result && result.errors) {
      errors.push(`ユーザー ${username}: ${result.errors}`);
    } else {
      existingUsernames.add(username.toLowerCase());
      createdUsers.push({
        username,
        display_name: displayName,
        password: initialPassword,
        pit_side: pitSide,
        pit_number: pitNumber,
      });
    }
  }

  revalidatePath("/settings/users");

  if (createdUsers.length === 0 && skippedCount > 0 && errors.length === 0) {
    return {
      errors: `既存のユーザーと重複しているため、新規登録されたユーザーはありませんでした（${skippedCount}件スキップ）。`,
    };
  }

  if (errors.length > 0) {
    return {
      errors: `一部のユーザー登録に失敗しました:\n${errors.join("\n")}`,
      success: `Homepageから ${createdUsers.length} 件のユーザーを新規登録しました（${skippedCount}件スキップ）。`,
      createdUsers,
    };
  }

  return {
    success: `Homepageから ${createdUsers.length} 件のユーザーを正常に新規登録しました！（${skippedCount}件既存スキップ）`,
    createdUsers,
  };
}
