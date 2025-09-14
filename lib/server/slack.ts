import { ChatPostMessageArguments, WebClient } from "@slack/web-api";
import { Timestamp } from "firebase-admin/firestore";

import { FirestoreUser } from "@/types/user";
import { getFirestore } from "@/lib/firebase/serverApp";

const COLLECTION_NAME = process.env.NEXT_PUBLIC_USER_COLLECTION || "users";

// 環境変数からSlack Bot Tokenを取得
const slackToken = process.env.SLACK_BOT_TOKEN;

if (!slackToken) {
  throw new Error("SLACK_BOT_TOKEN is not set in environment variables");
}

// WebClientインスタンス生成
export const slackClient = new WebClient(slackToken);

/**
 * 指定したSlackチャンネルにメッセージを投稿する
 * chat:write.publicの権限を使用してjoinなしで投稿
 * @param channel SlackチャンネルIDまたはチャンネル名（#prefix付きも可）
 * @param markdown_text メッセージ内容 (mrkdwn形式)
 * @param at_channel @channelで通知する場合true
 */
export async function postSlackMessage({
  channel,
  markdown_text,
  at_channel = false,
}: {
  channel: string;
  markdown_text: string;
  at_channel?: boolean;
}): Promise<void> {
  let text = markdown_text;

  if (at_channel) {
    text = "<!channel> " + text;
  }

  const options: ChatPostMessageArguments = {
    channel,
    text,
    mrkdwn: true,
  };

  // chat:write.publicの権限でjoinなしで直接投稿
  await slackClient.chat.postMessage(options);
}

/**
 * User型(receiver)にSlack通知を送信する
 * Firebaseに保存されたchannel_idを使用して直接投稿
 * @param receiver User型 (luciaのUser)
 * @param markdown_text メッセージ内容 (mrkdwn形式)
 * @param at_channel @channelで通知する場合true (デフォルト: false)
 */
export async function sendSlackNotifyMessage({
  receiver,
  markdown_text,
  at_channel = false,
}: {
  receiver: string;
  markdown_text: string;
  at_channel?: boolean;
}): Promise<void> {
  const channelNamePart = receiver ?? "";

  if (!channelNamePart) {
    throw new Error("receiver.display_nameが未設定です");
  }

  // Firebaseからユーザー情報とslack_channel_idを取得
  const db = await getFirestore();
  const usersSnapshot = await db
    .collection(COLLECTION_NAME)
    .where("display_name", "==", channelNamePart)
    .limit(1)
    .get();

  if (usersSnapshot.empty) {
    throw new Error(`ユーザーが見つかりません: ${channelNamePart}`);
  }

  const userData = usersSnapshot.docs[0].data() as FirestoreUser;
  const slackChannelId = userData.slack_channel_id;

  if (!slackChannelId) {
    throw new Error(
      `Slackチャンネル情報が未設定です: ${channelNamePart}。管理者にチャンネルID取得の実行を依頼してください。`,
    );
  }

  // 保存されたチャンネルIDで直接投稿
  await postSlackMessage({
    channel: slackChannelId,
    markdown_text,
    at_channel,
  });
}

/**
 * 全ユーザーのSlackチャンネルIDを取得してFirebaseに保存する
 * admin用の管理機能
 */
export async function fetchAndSaveAllSlackChannelIds(): Promise<{
  success: number;
  failed: number;
  errors: string[];
}> {
  const db = await getFirestore();
  const errors: string[] = [];
  let success = 0;
  let failed = 0;

  try {
    // 全チャンネルを一度に取得
    const channels = await getAllSlackChannels();

    // 全ユーザーを取得
    const usersSnapshot = await db.collection(COLLECTION_NAME).get();

    // 各ユーザーに対してチャンネルIDを検索・保存
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data() as FirestoreUser;
      const displayName = userData.display_name?.toLowerCase();

      if (!displayName) {
        errors.push(`ユーザー ${userData.id}: display_nameが未設定`);
        failed++;
        continue;
      }

      // display_nameを含むチャンネルを検索
      const matchedChannel = channels.find(
        (channel) =>
          channel.name && channel.name.toLowerCase().includes(displayName),
      );

      if (matchedChannel && matchedChannel.id) {
        // チャンネルIDをFirebaseに保存
        await userDoc.ref.update({
          slack_channel_id: matchedChannel.id,
          updatedAt: Timestamp.now(),
        });
        success++;
      } else {
        errors.push(
          `ユーザー ${userData.display_name}: チャンネルが見つかりません`,
        );
        failed++;
      }
    }

    return { success, failed, errors };
  } catch (error) {
    throw new Error(`チャンネルID取得処理中にエラーが発生しました: ${error}`);
  }
}

/**
 * 全Slackチャンネルを一度に取得する
 * conversations.listを使用するが、この関数は管理者が手動実行時のみ使用
 */
async function getAllSlackChannels(): Promise<
  Array<{ id?: string; name?: string }>
> {
  const channels: Array<{ id?: string; name?: string }> = [];
  let cursor: string | undefined = undefined;

  do {
    const res = await slackClient.conversations.list({
      exclude_archived: true,
      limit: 1000,
      cursor,
      types: "public_channel,private_channel",
    });

    if (res.channels) {
      channels.push(...res.channels);
    }

    cursor = res.response_metadata?.next_cursor;
  } while (cursor);

  return channels;
}
