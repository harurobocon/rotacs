import crypto from "crypto";

/**
 * 自動生成用のランダムパスワード（英大文字、小文字、数字を含む）を生成します。
 */
export function generateRandomPassword(length: number = 6): string {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
  let result = "";
  const bytes = crypto.randomBytes(length);

  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }

  return result;
}
