const DEFAULT_DOMAIN = "rotacs.kantouharurobo.com";

/**
 * アプリの認証用ドメインを取得します。
 * NEXT_PUBLIC_APP_DOMAIN が設定されていれば、プロトコル（https:// 等）や末尾スラッシュを除去して正規化します。
 */
export function getAppDomain(): string {
  const rawDomain = process.env.NEXT_PUBLIC_APP_DOMAIN?.trim();

  if (!rawDomain) {
    return DEFAULT_DOMAIN;
  }

  // http:// または https:// を除去
  let domain = rawDomain.replace(/^https?:\/\//i, "");

  // 末尾のスラッシュ以降を除去
  domain = domain.split("/")[0];

  return domain || DEFAULT_DOMAIN;
}

/**
 * ユーザー名から Firebase Authentication 用のメールアドレスを生成します。
 */
export function usernameToEmail(username: string): string {
  const domain = getAppDomain();

  return `${username}@${domain}`;
}

/**
 * メールアドレスからユーザー名を抽出します。
 */
export function emailToUsername(email: string): string {
  return email.split("@")[0] || "";
}
