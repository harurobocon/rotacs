/**
 * RoTACS Environment Variables Utility & Validator
 *
 * Vercelおよびローカル開発での安全なデプロイ・稼働のために、
 * 環境変数の正規化・必須チェック・オプショナル状態の診断を提供します。
 */

/**
 * 環境変数の値を安全に正規化（前後の空白・クォートのトリム）
 */
export function normalizeEnvValue(
  value: string | undefined,
): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  let trimmed = value.trim();

  // 前後のダブルクォートまたはシングルクォートを除去
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    trimmed = trimmed.substring(1, trimmed.length - 1).trim();
  }

  return trimmed || undefined;
}

/**
 * Firebase Admin秘密鍵を正規化（改行エスケープ \\n の復元）
 */
export function normalizePrivateKey(
  value: string | undefined,
): string | undefined {
  const normalized = normalizeEnvValue(value);

  if (!normalized) {
    return undefined;
  }

  // リテラルの "\n" を実際の改行文字に置換
  return normalized.replace(/\\n/g, "\n");
}

/**
 * 必須のクライアント環境変数 (NEXT_PUBLIC_*)
 * ビルド時およびブラウザでのFirebase初期化に不可欠
 */
export const REQUIRED_CLIENT_ENV_KEYS = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
] as const;

/**
 * 必須のサーバー環境変数
 * Firebase Admin SDKの初期化に不可欠（サーバーランタイム専用）
 */
export const REQUIRED_SERVER_ENV_KEYS = [
  "FIREBASE_ADMIN_CLIENT_EMAIL",
  "FIREBASE_ADMIN_PRIVATE_KEY",
] as const;

/**
 * 推奨・オプショナルな環境変数
 */
export const OPTIONAL_ENV_KEYS = [
  "SLACK_BOT_TOKEN",
  "NEXT_PUBLIC_APP_DOMAIN",
  "NEXT_PUBLIC_USER_COLLECTION",
  "NEXT_PUBLIC_CHECK1_RESERVATION_COLLECTION",
  "NEXT_PUBLIC_CHECK2_RESERVATION_COLLECTION",
  "NEXT_PUBLIC_TESTRUN_RESERVATION_COLLECTION",
  "NEXT_PUBLIC_PRACTICE_RESERVATION_COLLECTION",
] as const;

export type RequiredClientEnvKey = (typeof REQUIRED_CLIENT_ENV_KEYS)[number];
export type RequiredServerEnvKey = (typeof REQUIRED_SERVER_ENV_KEYS)[number];
export type OptionalEnvKey = (typeof OPTIONAL_ENV_KEYS)[number];

export interface EnvValidationResult {
  valid: boolean;
  missingRequiredClient: string[];
  missingRequiredServer: string[];
  missingOptional: string[];
  errors: string[];
  warnings: string[];
}

export interface ValidateEnvOptions {
  /**
   * サーバー用環境変数 (FIREBASE_ADMIN_*) の検証を行うかどうか
   * クライアント側ビルドやブラウザ環境では false に設定
   * デフォルト: Node.js サーバー環境なら true
   */
  checkServerSecrets?: boolean;

  /**
   * 未設定の場合に例外を投げるかどうか
   * デフォルト: false
   */
  throwOnError?: boolean;

  /**
   * 検証対象の環境変数オブジェクト（テスト用。デフォルト: process.env）
   */
  env?: Record<string, string | undefined>;
}

/**
 * 現在の環境変数を検証する
 */
export function validateEnv(
  options: ValidateEnvOptions = {},
): EnvValidationResult {
  const env = options.env ?? process.env;
  const isServer = options.checkServerSecrets ?? typeof window === "undefined";

  const missingRequiredClient: string[] = [];
  const missingRequiredServer: string[] = [];
  const missingOptional: string[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. クライアント必須環境変数の検証
  for (const key of REQUIRED_CLIENT_ENV_KEYS) {
    const value = normalizeEnvValue(env[key]);

    if (!value) {
      missingRequiredClient.push(key);
      errors.push(`[必須・クライアント] ${key} が設定されていません。`);
    }
  }

  // 2. サーバー必須環境変数の検証（サーバー環境の場合）
  if (isServer) {
    for (const key of REQUIRED_SERVER_ENV_KEYS) {
      const value =
        key === "FIREBASE_ADMIN_PRIVATE_KEY"
          ? normalizePrivateKey(env[key])
          : normalizeEnvValue(env[key]);

      if (!value) {
        missingRequiredServer.push(key);
        errors.push(`[必須・サーバー] ${key} が設定されていません。`);
      } else if (
        key === "FIREBASE_ADMIN_PRIVATE_KEY" &&
        !value.includes("-----BEGIN PRIVATE KEY-----")
      ) {
        errors.push(
          `[フォーマット警告] ${key} の値が有効な PEM 形式の秘密鍵でない可能性があります。`,
        );
      }
    }
  }

  // 3. オプショナル環境変数の診断
  for (const key of OPTIONAL_ENV_KEYS) {
    const value = normalizeEnvValue(env[key]);

    if (!value) {
      missingOptional.push(key);
      if (key === "SLACK_BOT_TOKEN") {
        warnings.push(
          `[オプショナル] ${key} が未設定です（Slack通知機能は無効化され、ビルドと基本動作は継続します）。`,
        );
      } else if (key === "NEXT_PUBLIC_APP_DOMAIN") {
        warnings.push(
          `[オプショナル] ${key} が未設定です（通知内リンクや一部のURL生成にフォールバックが適用されます）。`,
        );
      }
    }
  }

  const valid = errors.length === 0;

  const result: EnvValidationResult = {
    valid,
    missingRequiredClient,
    missingRequiredServer,
    missingOptional,
    errors,
    warnings,
  };

  if (!valid && options.throwOnError) {
    throw new Error(
      `環境変数の検証に失敗しました:\n${errors.map((e) => `  - ${e}`).join("\n")}`,
    );
  }

  return result;
}

/**
 * 検証結果をコンソール出力用にフォーマット
 */
export function formatEnvReport(result: EnvValidationResult): string {
  const lines: string[] = [];

  lines.push("==================================================");
  lines.push("           RoTACS 環境変数 検証レポート            ");
  lines.push("==================================================");

  if (result.valid) {
    lines.push("✅ 必須の環境変数はすべて正しく設定されています。");
  } else {
    lines.push("❌ 必須の環境変数が不足しています！");
    result.errors.forEach((err) => lines.push(`   ✖ ${err}`));
  }

  if (result.warnings.length > 0) {
    lines.push("");
    lines.push("⚠️  注意 / オプショナル環境変数の状況:");
    result.warnings.forEach((warn) => lines.push(`   ℹ ${warn}`));
  }

  lines.push("==================================================");

  return lines.join("\n");
}
