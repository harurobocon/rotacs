import "server-cli-only";

import { sendSlackNotifyMessage, isSlackConfigured } from "./slack";
import { MatchData } from "@/types/match";

/**
 * 3試合前のチームに「移動準備」のSlack通知を送信
 */
export async function sendMatchPreCallNotification(
  match: MatchData,
): Promise<void> {
  if (!isSlackConfigured()) {
    console.log(
      `[Slack Mock] 3試合前準備通知 (第${match.match_index}試合): ${match.team_red.display_name} / ${match.team_blue.display_name}`,
    );
    return;
  }

  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || "localhost:3000";
  const message = `[第${match.match_index}試合: 赤 ${match.team_red.display_name} vs 青 ${match.team_blue.display_name}] 3試合前となりました。ピット/控室で移動準備を開始してください。\nhttps://${appDomain}/display/match`;

  const receivers = [
    match.team_red.display_name,
    match.team_blue.display_name,
  ];

  await Promise.all(
    receivers.map((receiver) =>
      sendSlackNotifyMessage({
        receiver,
        markdown_text: message,
        at_channel: true,
      }).catch((err) => {
        console.error(`Match pre-call notification error for ${receiver}:`, err);
      }),
    ),
  );
}

/**
 * 2試合前の試合間にチームに「コート移動」のSlack通知を送信
 */
export async function sendMatchMoveCallNotification(
  match: MatchData,
): Promise<void> {
  if (!isSlackConfigured()) {
    console.log(
      `[Slack Mock] 2試合前コート移動通知 (第${match.match_index}試合): ${match.team_red.display_name} / ${match.team_blue.display_name}`,
    );
    return;
  }

  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || "localhost:3000";
  const message = `[第${match.match_index}試合: 赤 ${match.team_red.display_name} vs 青 ${match.team_blue.display_name}] 2試合前となりました。試合間インターバルですのでコート待機場所へ移動をお願いします。\nhttps://${appDomain}/display/match`;

  const receivers = [
    match.team_red.display_name,
    match.team_blue.display_name,
  ];

  await Promise.all(
    receivers.map((receiver) =>
      sendSlackNotifyMessage({
        receiver,
        markdown_text: message,
        at_channel: true,
      }).catch((err) => {
        console.error(`Match move-call notification error for ${receiver}:`, err);
      }),
    ),
  );
}
