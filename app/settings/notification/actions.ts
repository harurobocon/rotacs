"use server";

import "server-cli-only";

import { redirect } from "next/navigation";

import { getFirestoreUserById } from "@/lib/server/firestoreUserHelpers";
import { postSlackMessage } from "@/lib/server/slack";

/**
 * Send a test Slack message
 * Note: userId parameter should be passed from client-side Firebase Auth currentUser.uid
 * This function no longer uses validateRequest - auth is handled client-side
 */
export async function handleSlackTestMessageSend(userId: string) {
  if (!userId) {
    return { ok: false, error: "ユーザーIDが指定されていません" };
  }

  // Firestoreからユーザー情報取得
  const firestoreUser = await getFirestoreUserById(userId);

  if (!firestoreUser) {
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

  return { ok: true };
}
