import { ChatPostMessageArguments, WebClient } from "@slack/web-api";
import { Timestamp } from "firebase-admin/firestore";

import { FirestoreUser } from "@/types/user";
import { getFirestore } from "@/lib/firebase/serverApp";
import { getCheckLocationSettings } from "@/lib/server/settings";
import {
  RESERVATION_SETTINGS_COLLECTION,
  SYSTEM_SLACK_CHANNELS_DOCUMENT_ID,
} from "@/types/settings";

const COLLECTION_NAME = process.env.NEXT_PUBLIC_USER_COLLECTION || "users";

// システムチャンネル（予約通知用）を動的に生成する関数
async function getSystemChannels(): Promise<
  Array<{ name: string; description: string }>
> {
  const settings = await getCheckLocationSettings();
  const channels: Array<{ name: string; description: string }> = [];

  // 計量計測1のモードに応じてチャンネルを追加
  if (settings.check1 === "dual") {
    channels.push(
      { name: "00_西_計量計測1", description: "計量計測1（西）の予約通知用" },
      { name: "00_東_計量計測1", description: "計量計測1（東）の予約通知用" },
    );
  } else {
    channels.push({
      name: "00_計量計測1",
      description: "計量計測1の予約通知用",
    });
  }

  // 計量計測2のモードに応じてチャンネルを追加
  if (settings.check2 === "dual") {
    channels.push(
      { name: "00_西_計量計測2", description: "計量計測2（西）の予約通知用" },
      { name: "00_東_計量計測2", description: "計量計測2（東）の予約通知用" },
    );
  } else {
    channels.push({
      name: "00_計量計測2",
      description: "計量計測2の予約通知用",
    });
  }

  // テストランチャンネルを追加
  channels.push(
    { name: "00_赤テストラン", description: "赤テストランの予約通知用" },
    { name: "00_青テストラン", description: "青テストランの予約通知用" },
  );

  return channels;
}

// 環境変数からSlack Bot Tokenを取得
const slackToken = process.env.SLACK_BOT_TOKEN;

if (!slackToken) {
  throw new Error("SLACK_BOT_TOKEN is not set in environment variables");
}

// WebClientインスタンス生成
export const slackClient = new WebClient(slackToken);

/**
 * システムチャンネルのIDを取得する
 * Firestoreにキャッシュされたチャンネル IDを使用
 */
async function getSystemChannelId(
  channelDisplayName: string,
  side?: string,
): Promise<string> {
  const db = await getFirestore();
  const settings = await getCheckLocationSettings();

  // チャンネル表示名からSlackチャンネル名を生成
  let channelName = "";

  if (channelDisplayName.includes("計量計測1")) {
    if (settings.check1 === "dual" && side) {
      channelName = `00_${side}_計量計測1`;
    } else {
      channelName = "00_計量計測1";
    }
  } else if (channelDisplayName.includes("計量計測2")) {
    if (settings.check2 === "dual" && side) {
      channelName = `00_${side}_計量計測2`;
    } else {
      channelName = "00_計量計測2";
    }
  } else if (channelDisplayName.includes("赤テストラン")) {
    channelName = "00_赤テストラン";
  } else if (channelDisplayName.includes("青テストラン")) {
    channelName = "00_青テストラン";
  }

  if (!channelName) {
    throw new Error(`不明なシステムチャンネル: ${channelDisplayName}`);
  }

  // Firestoreからシステムチャンネル情報を取得
  const channelDoc = await db
    .collection(RESERVATION_SETTINGS_COLLECTION)
    .doc(SYSTEM_SLACK_CHANNELS_DOCUMENT_ID)
    .get();

  if (channelDoc.exists) {
    const data = channelDoc.data();

    if (data?.[channelName]) {
      return data[channelName];
    }
  }

  // キャッシュがない場合は検索して保存
  const channels = await getAllSlackChannels();
  const targetChannel = channels.find(
    (ch) => ch.name?.toLowerCase() === channelName.toLowerCase(),
  );

  if (!targetChannel?.id) {
    throw new Error(`システムチャンネルが見つかりません: ${channelName}`);
  }

  // Firestoreに保存（既存データとマージ）
  const existingData = channelDoc.exists ? channelDoc.data() : {};

  await db
    .collection(RESERVATION_SETTINGS_COLLECTION)
    .doc(SYSTEM_SLACK_CHANNELS_DOCUMENT_ID)
    .set(
      {
        ...existingData,
        [channelName]: targetChannel.id,
        [`${channelName}_updated_at`]: Timestamp.now(),
      },
      { merge: true },
    );

  return targetChannel.id;
}

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
 * @param side 計量計測のside情報（"西" | "東" | undefined）
 */
export async function sendSlackNotifyMessage({
  receiver,
  markdown_text,
  at_channel = false,
  side,
}: {
  receiver: string;
  markdown_text: string;
  at_channel?: boolean;
  side?: string;
}): Promise<void> {
  const channelNamePart = receiver ?? "";

  if (!channelNamePart) {
    throw new Error("receiver.display_nameが未設定です");
  }

  const db = await getFirestore();

  // システムチャンネル（計量計測など）の場合
  if (
    channelNamePart.includes("計量計測") ||
    channelNamePart.includes("テストラン")
  ) {
    const channelId = await getSystemChannelId(channelNamePart, side);

    await postSlackMessage({
      channel: channelId,
      markdown_text,
      at_channel,
    });

    return;
  }

  // 通常のユーザーチャンネルの場合
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
 * 指定されたユーザーのSlackチャンネルを作成する
 * @param user ユーザー情報
 * @returns 作成されたチャンネルID
 */
export async function createSlackChannelForUser(user: {
  username: string;
  display_name: string;
}): Promise<string> {
  // usernameから先頭2桁を抽出 (例: "01_asahikawa" -> "01")
  const prefix = user.username.match(/^(\d{2})_/)?.[1];

  if (!prefix) {
    throw new Error(
      `ユーザー名の形式が不正です: ${user.username}（先頭2桁の数字とアンダースコアが必要）`,
    );
  }

  // チャンネル名を生成: {username_prefix}_{display_name}
  // Slackは小文字、数字、ハイフン、アンダースコアのみ許可（日本語も許可されるが、英数字は小文字に変換）
  const channelName = `${prefix}_${user.display_name}`.toLowerCase();

  try {
    // Public channelとして作成
    const result = await slackClient.conversations.create({
      name: channelName,
      is_private: false,
    });

    if (!result.channel?.id) {
      throw new Error("チャンネルIDの取得に失敗しました");
    }

    return result.channel.id;
  } catch (error: any) {
    // チャンネルが既に存在する場合
    if (error.data?.error === "name_taken") {
      // 既存チャンネルを検索してIDを返す
      const channels = await getAllSlackChannels();
      const existingChannel = channels.find(
        (ch) => ch.name?.toLowerCase() === channelName.toLowerCase(),
      );

      if (existingChannel?.id) {
        // 既存チャンネルが見つかった場合はそのIDを返す
        return existingChannel.id;
      }

      throw new Error(
        `チャンネル "${channelName}" は既に存在しますが、IDの取得に失敗しました`,
      );
    }

    throw new Error(
      `チャンネル作成失敗 (${channelName}): ${error.message || error}`,
    );
  }
}

/**
 * システムチャンネル（予約通知用）を作成する
 * @returns 作成結果
 */
export async function createSystemChannels(): Promise<{
  success: number;
  failed: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let success = 0;
  let failed = 0;

  // 現在のモード設定に応じたシステムチャンネル一覧を取得
  const systemChannels = await getSystemChannels();

  for (const channel of systemChannels) {
    try {
      const channelName = channel.name.toLowerCase();
      const result = await slackClient.conversations.create({
        name: channelName,
        is_private: false,
      });

      if (result.channel?.id) {
        success++;
      } else {
        errors.push(`${channel.name}: チャンネルIDの取得に失敗`);
        failed++;
      }
    } catch (error: any) {
      // チャンネルが既に存在する場合はスキップ
      if (error.data?.error === "name_taken") {
        success++;
      } else {
        errors.push(`${channel.name}: ${error.message || error}`);
        failed++;
      }
    }
  }

  return { success, failed, errors };
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
 * 全システムチャンネルのIDを取得してFirestoreに保存する
 */
export async function fetchAndSaveSystemChannelIds(): Promise<{
  success: number;
  failed: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let success = 0;
  let failed = 0;

  try {
    const channels = await getAllSlackChannels();
    const systemChannels = await getSystemChannels();
    const db = await getFirestore();

    const channelIdMap: Record<string, any> = {};

    for (const sysChannel of systemChannels) {
      const channelName = sysChannel.name.toLowerCase();
      const slackChannel = channels.find(
        (ch) => ch.name?.toLowerCase() === channelName,
      );

      if (slackChannel?.id) {
        channelIdMap[sysChannel.name] = slackChannel.id;
        channelIdMap[`${sysChannel.name}_updated_at`] = Timestamp.now();
        success++;
      } else {
        errors.push(`${sysChannel.name}: チャンネルが見つかりません`);
        failed++;
      }
    }

    // 一括で保存
    if (Object.keys(channelIdMap).length > 0) {
      await db
        .collection(RESERVATION_SETTINGS_COLLECTION)
        .doc(SYSTEM_SLACK_CHANNELS_DOCUMENT_ID)
        .set(channelIdMap, { merge: true });
    }
  } catch (error: any) {
    errors.push(`エラー: ${error.message || error}`);
    failed++;
  }

  return { success, failed, errors };
}

/**
 * システムが作成した全ユーザーチャンネルを削除する
 * チャンネル名が "NN_" で始まるパターン(NN = 00-99の数字)のみ削除
 * アーカイブ後、古い名前をリネームして名前の重複を防ぐ
 * @param channelNamesToExclude 削除対象から除外するチャンネル名のリスト
 */
export async function deleteAllUserSlackChannels(
  channelNamesToExclude: string[] = [],
): Promise<{
  success: number;
  failed: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let success = 0;
  let failed = 0;

  try {
    // 全チャンネルを取得
    const channels = await getAllSlackChannels();

    // システムが作成したチャンネルのパターン: "NN_" で始まる(NNは2桁の数字)
    const userChannelPattern = /^\d{2}_/;

    // 除外リストを小文字に変換
    const excludeSet = new Set(
      channelNamesToExclude.map((name) => name.toLowerCase()),
    );

    // 削除対象のチャンネルをフィルタリング
    const channelsToDelete = channels.filter(
      (channel) =>
        channel.name &&
        channel.id &&
        userChannelPattern.test(channel.name) &&
        !excludeSet.has(channel.name.toLowerCase()),
    );

    // 並列で削除（ただし同時実行数を制限）
    const BATCH_SIZE = 5;

    for (let i = 0; i < channelsToDelete.length; i += BATCH_SIZE) {
      const batch = channelsToDelete.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (channel) => {
          try {
            // まず、古い名前を「archived-YYYYMMDD-元の名前」にリネーム
            // これにより同じ名前で新規作成可能になる
            const now = new Date();
            const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
            const timePart = now.toTimeString().slice(0, 8).replace(/:/g, "");
            const timestamp = `${datePart}-${timePart}`;
            const newName = `archived-${timestamp}-${channel.name}`.substring(
              0,
              80,
            ); // Slackの80文字制限

            await slackClient.conversations.rename({
              channel: channel.id!,
              name: newName,
            });

            // リネーム後にチャンネルをアーカイブ
            await slackClient.conversations.archive({
              channel: channel.id!,
            });

            success++;
          } catch (error: any) {
            errors.push(
              `チャンネル ${channel.name} の削除失敗: ${error.message || error}`,
            );
            failed++;
          }
        }),
      );
    }

    return { success, failed, errors };
  } catch (error) {
    throw new Error(`チャンネル削除処理中にエラーが発生しました: ${error}`);
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
