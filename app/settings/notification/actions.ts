"use server";

import "server-cli-only";

import { redirect } from "next/navigation";

import { validateRequest } from "@/lib/server/auth";
import { getUserFromFirestore } from "@/lib/server/firestoreUser";
import { postSlackMessage } from "@/lib/server/slack";

export async function handleSlackTestMessageSend() {
  const { user } = await validateRequest();

  if (!user) {
    return redirect("/login");
  }

  // Firestoreからユーザー情報取得
  const firestoreUser = await getUserFromFirestore(user.id);

  if (!firestoreUser) {
    // エラー時も何か返す
    return { ok: false, error: "ユーザー情報がFirestoreに存在しません" };
  }

  const slackChannelId = firestoreUser.slack_channel_id;

  if (!slackChannelId) {
    return {
      ok: false,
      error:
        "Slackチャンネル情報が未設定です。管理者にチャンネルID取得の実行を依頼してください。",
    };
  }

  await postSlackMessage({
    channel: slackChannelId,
    markdown_text:
      "RoTACS (Robocon Testrun And Check Scheduler)からのSlackテスト通知です。",
    at_channel: false,
  });

  // 正常時も何か返す
  return { ok: true };
}
