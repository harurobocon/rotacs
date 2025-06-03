"use server";

import "server-cli-only";

import { redirect } from "next/navigation";
import { validateRequest } from "@/lib/server/auth";
import {
  sendLineNotifyMessage,
  startLineNotifyAuthorize,
} from "@/lib/server/line-notify";
import { getUserFromFirestore } from "@/lib/server/firestoreUser";
import { postSlackMessage, findSlackChannelId } from "@/lib/server/slack";

export async function startLineLogin(formData: FormData) {
  const { user, session } = await validateRequest();

  if (!user) {
    return redirect("/login");
  }

  const description = formData.get("description")?.toString() ?? "";

  const url = await startLineNotifyAuthorize(user, session, description);

  return redirect(url);
}

export async function handleTestMessageSend() {
  const { user } = await validateRequest();

  if (!user) {
    return redirect("/login");
  }

  await sendLineNotifyMessage(
    {
      message:
        "RoTACS (Robocon Testrun And Check Scheduler)からのテスト通知です。",
    },
    user,
  );
}

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

  // pit_numberを2桁0埋め
  const pitNumberStr = firestoreUser.pit_number.toString().padStart(2, "0");
  const displayName = firestoreUser.display_name.toLowerCase();

  // チャンネルIDを取得
  const channelId = await findSlackChannelId(displayName);

  if (!channelId) {
    return {
      ok: false,
      error: `Slackチャンネルが見つかりません: #${pitNumberStr}-${displayName}`,
    };
  }

  await postSlackMessage({
    channel: channelId,
    markdown_text:
      "RoTACS (Robocon Testrun And Check Scheduler)からのSlackテスト通知です。",
    at_channel: false,
  });

  // 正常時も何か返す
  return { ok: true };
}
