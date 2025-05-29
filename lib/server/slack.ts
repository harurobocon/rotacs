import { ChatPostMessageArguments, WebClient } from "@slack/web-api";

// 環境変数からSlack Bot Tokenを取得
const slackToken = process.env.SLACK_BOT_TOKEN;

if (!slackToken) {
  throw new Error("SLACK_BOT_TOKEN is not set in environment variables");
}

// WebClientインスタンス生成
export const slackClient = new WebClient(slackToken);

/**
 * 指定したSlackチャンネルにメッセージを投稿する
 * @param channel SlackチャンネルIDまたはチャンネル名
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

  console.log(options);

  try {
    await slackClient.chat.postMessage(options);
  } catch (error: any) {
    // not_in_channelエラー時はjoinしてリトライ
    if (error.data?.error === "not_in_channel") {
      try {
        await slackClient.conversations.join({ channel });
        await slackClient.chat.postMessage({
          channel,
          text,
          mrkdwn: true,
        });
      } catch (joinError) {
        throw joinError;
      }
    } else {
      throw error;
    }
  }
}

/**
 * display_nameを含むSlackチャンネル名を検索し、最初に一致したチャンネルのIDを返す
 * @param namePart チャンネル名の一部の文字列
 * @returns チャンネルID（見つからなければnull）
 */
export async function findSlackChannelId(
  namePart: string,
): Promise<string | null> {
  let cursor: string | undefined = undefined;

  do {
    const res = await slackClient.conversations.list({
      exclude_archived: true,
      limit: 1000,
      cursor,
      types: "public_channel,private_channel",
    });

    if (!res.channels) break;
    for (const channel of res.channels) {
      if (channel.name && channel.name.toLowerCase().includes(namePart)) {
        return channel.id ?? null;
      }
    }
    cursor = res.response_metadata?.next_cursor;
  } while (cursor);

  return null;
}
