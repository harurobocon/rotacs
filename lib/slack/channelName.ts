const USERNAME_PREFIX_PATTERN = /^(\d{2})_/;

/**
 * display_nameをSlackチャンネル名として安全な形式に変換する。
 * - 空白はハイフン化
 * - 記号/絵文字などSlackで拒否される文字は除去
 * - 連続する区切り記号を圧縮
 */
export function convertDisplayNameToSlackChannelPart(displayName: string): string {
  const normalized = displayName.normalize("NFKC").trim().toLowerCase();

  const cleaned = normalized
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}_-]/gu, "")
    .replace(/[-_]{2,}/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "");

  // 末尾が空になるケースを避ける
  return cleaned || "team";
}

export function extractUserChannelPrefix(username: string): string {
  const prefix = username.match(USERNAME_PREFIX_PATTERN)?.[1];

  if (!prefix) {
    throw new Error(
      `ユーザー名の形式が不正です: ${username}（先頭2桁の数字とアンダースコアが必要）`,
    );
  }

  return prefix;
}

export function buildUserSlackChannelName(user: {
  username: string;
  display_name: string;
}): string {
  const prefix = extractUserChannelPrefix(user.username);
  const channelPart = convertDisplayNameToSlackChannelPart(user.display_name);

  return `${prefix}_${channelPart}`;
}
