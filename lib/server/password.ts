import crypto from "crypto";

/**
 * 自動生成用のランダムパスワード（6桁の自然数）を生成します。
 */
export function generateRandomPassword(length: number = 6): string {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length);

  return crypto.randomInt(min, max).toString();
}
