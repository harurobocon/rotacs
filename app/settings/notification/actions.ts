"use server";

import "server-cli-only";

import { getFirestoreUserById } from "@/lib/server/firestoreUserHelpers";
import { isSlackConfigured, postSlackMessage } from "@/lib/server/slack";

/**
 * Send a test Slack message
 * Note: userId should be provided from client-side Firebase Auth currentUser.uid.
 */
export async function handleSlackTestMessageSend(
  _state: { ok?: boolean; error?: string },
  formData: FormData,
) {
  if (!isSlackConfigured()) {
    return {
      ok: false,
      error:
        "SLACK_BOT_TOKEN が環境変数に設定されていないため、Slackテスト通知を送信できません。",
    };
  }
  const userId = formData.get("userId")?.toString() ?? "";

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
