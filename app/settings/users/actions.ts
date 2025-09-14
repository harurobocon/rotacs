"use server";

import "server-cli-only";

import { parse as parseCsv } from "csv/sync";
import { redirect } from "next/navigation";

import { db } from "@/lib/server/db";
import { UserTable, UserRole } from "@/types/auth";
import { ActionResult } from "@/types/actions";
import { createUserInfo } from "@/lib/server/auth";
import { CheckSide } from "@/types/check";
import {
  deleteUserFromFirestore,
  upsertUserToFirestore,
} from "@/lib/server/firestoreUser";
import { fetchAndSaveAllSlackChannelIds } from "@/lib/server/slack";

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

export async function deleteUsers(formData: FormData) {
  const userIds = formData.getAll("user_id").map((id) => id.toString());

  await db.deleteFrom("user").where("id", "in", userIds).execute();

  // Firestoreからも削除
  await Promise.all(userIds.map((id) => deleteUserFromFirestore(id)));

  return redirect("/settings/users/delete/success");
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
