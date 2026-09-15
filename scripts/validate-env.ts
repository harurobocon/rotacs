import path from "path";
import dotenv from "dotenv";

import {
  validateEnv,
  formatEnvReport,
  REQUIRED_CLIENT_ENV_KEYS,
  REQUIRED_SERVER_ENV_KEYS,
  OPTIONAL_ENV_KEYS,
  normalizeEnvValue,
} from "../lib/env";

// 環境変数ファイルの読み込み（.env, .env.local）
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env.local"), override: true });

function maskValue(key: string, value: string | undefined): string {
  if (!value) {
    return "(未設定)";
  }

  const normalized = normalizeEnvValue(value) ?? "";

  if (key.includes("KEY") || key.includes("TOKEN") || key.includes("PASSWORD")) {
    if (normalized.length <= 8) {
      return "********";
    }
    return `${normalized.substring(0, 4)}...${normalized.substring(normalized.length - 4)}`;
  }

  if (normalized.length > 40) {
    return `${normalized.substring(0, 37)}...`;
  }

  return normalized;
}

function runCheck() {
  console.log("\n🔍 RoTACS 環境変数の検証を実行中...\n");

  const result = validateEnv({ checkServerSecrets: true });

  console.log("【環境変数設定状況】");
  console.log("------------------------------------------------------------------");
  console.log("カテゴリ / 変数名                        状態        値 (プレビュー)");
  console.log("------------------------------------------------------------------");

  console.log("[必須: クライアント]");
  for (const key of REQUIRED_CLIENT_ENV_KEYS) {
    const val = process.env[key];
    const status = val ? "✅ 設定済" : "❌ 未設定";
    console.log(`  ${key.padEnd(38)} ${status}   ${maskValue(key, val)}`);
  }

  console.log("\n[必須: サーバー (Firebase Admin)]");
  for (const key of REQUIRED_SERVER_ENV_KEYS) {
    const val = process.env[key];
    const status = val ? "✅ 設定済" : "❌ 未設定";
    console.log(`  ${key.padEnd(38)} ${status}   ${maskValue(key, val)}`);
  }

  console.log("\n[オプショナル / 機能別]");
  for (const key of OPTIONAL_ENV_KEYS) {
    const val = process.env[key];
    const status = val ? "✅ 設定済" : "⚪ 未設定";
    console.log(`  ${key.padEnd(38)} ${status}   ${maskValue(key, val)}`);
  }

  console.log("------------------------------------------------------------------\n");

  console.log(formatEnvReport(result));

  if (!result.valid) {
    console.error("\n❌ エラー: 必須の環境変数が設定されていません。上記を確認してください。\n");
    process.exit(1);
  } else {
    console.log("\n✨ すべての必須環境変数の検証に合格しました！\n");
  }
}

runCheck();
