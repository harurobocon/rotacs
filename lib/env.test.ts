import { describe, it, expect, afterEach } from "vitest";

import { normalizeEnvValue, normalizePrivateKey, validateEnv } from "./env";
import { isSlackConfigured, getSlackClient } from "./server/slack";

describe("lib/env", () => {
  describe("normalizeEnvValue", () => {
    it("undefined または null の場合は undefined を返す", () => {
      expect(normalizeEnvValue(undefined)).toBeUndefined();
    });

    it("前後の空白をトリムする", () => {
      expect(normalizeEnvValue("  hello world  ")).toBe("hello world");
    });

    it("前後のダブルクォートを除去する", () => {
      expect(normalizeEnvValue('"value_with_quotes"')).toBe(
        "value_with_quotes",
      );
    });

    it("前後のシングルクォートを除去する", () => {
      expect(normalizeEnvValue("'value_with_quotes'")).toBe(
        "value_with_quotes",
      );
    });

    it("空文字の場合は undefined を返す", () => {
      expect(normalizeEnvValue("   ")).toBeUndefined();
      expect(normalizeEnvValue('""')).toBeUndefined();
    });
  });

  describe("normalizePrivateKey", () => {
    it("undefined の場合は undefined を返す", () => {
      expect(normalizePrivateKey(undefined)).toBeUndefined();
    });

    it("エスケープされた \\n を実際の改行文字に変換する", () => {
      const input =
        '"-----BEGIN PRIVATE KEY-----\\nMIIE...\\n-----END PRIVATE KEY-----"';
      const expected =
        "-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----";

      expect(normalizePrivateKey(input)).toBe(expected);
    });
  });

  describe("validateEnv", () => {
    const validBaseEnv: Record<string, string> = {
      NEXT_PUBLIC_FIREBASE_API_KEY: "dummy-api-key",
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "dummy.firebaseapp.com",
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: "dummy-project",
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "dummy.appspot.com",
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "123456789",
      NEXT_PUBLIC_FIREBASE_APP_ID: "1:123456789:web:dummy",
      FIREBASE_ADMIN_CLIENT_EMAIL:
        "admin@dummy-project.iam.gserviceaccount.com",
      FIREBASE_ADMIN_PRIVATE_KEY:
        "-----BEGIN PRIVATE KEY-----\ndummy-key\n-----END PRIVATE KEY-----",
    };

    it("必須環境変数がすべて揃っていれば valid: true を返す", () => {
      const result = validateEnv({
        env: validBaseEnv,
        checkServerSecrets: true,
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("SLACK_BOT_TOKEN が未設定でも valid: true であり、警告に含まれる", () => {
      const envWithoutSlack = { ...validBaseEnv };

      delete envWithoutSlack.SLACK_BOT_TOKEN;

      const result = validateEnv({
        env: envWithoutSlack,
        checkServerSecrets: true,
      });

      expect(result.valid).toBe(true);
      expect(result.missingOptional).toContain("SLACK_BOT_TOKEN");
      expect(result.warnings.some((w) => w.includes("SLACK_BOT_TOKEN"))).toBe(
        true,
      );
    });

    it("必須クライアント変数が不足している場合は valid: false となりエラーを含む", () => {
      const env = { ...validBaseEnv };

      delete env.NEXT_PUBLIC_FIREBASE_API_KEY;

      const result = validateEnv({ env, checkServerSecrets: true });

      expect(result.valid).toBe(false);
      expect(result.missingRequiredClient).toContain(
        "NEXT_PUBLIC_FIREBASE_API_KEY",
      );
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("必須サーバー変数が不足している場合は checkServerSecrets: true 時にエラーとなる", () => {
      const env = { ...validBaseEnv };

      delete env.FIREBASE_ADMIN_CLIENT_EMAIL;

      const result = validateEnv({ env, checkServerSecrets: true });

      expect(result.valid).toBe(false);
      expect(result.missingRequiredServer).toContain(
        "FIREBASE_ADMIN_CLIENT_EMAIL",
      );
    });

    it("checkServerSecrets: false の場合、サーバー変数が不足していても valid: true になる", () => {
      const env = { ...validBaseEnv };

      delete env.FIREBASE_ADMIN_CLIENT_EMAIL;
      delete env.FIREBASE_ADMIN_PRIVATE_KEY;

      const result = validateEnv({ env, checkServerSecrets: false });

      expect(result.valid).toBe(true);
      expect(result.missingRequiredServer).toHaveLength(0);
    });
  });
});

describe("lib/server/slack optionality", () => {
  const originalToken = process.env.SLACK_BOT_TOKEN;

  afterEach(() => {
    if (originalToken !== undefined) {
      process.env.SLACK_BOT_TOKEN = originalToken;
    } else {
      delete process.env.SLACK_BOT_TOKEN;
    }
  });

  it("SLACK_BOT_TOKEN が未設定の場合は isSlackConfigured() が false を返し getSlackClient() が null を返す", () => {
    delete process.env.SLACK_BOT_TOKEN;
    expect(isSlackConfigured()).toBe(false);
    expect(getSlackClient()).toBeNull();
  });

  it("SLACK_BOT_TOKEN が設定されている場合は isSlackConfigured() が true を返す", () => {
    process.env.SLACK_BOT_TOKEN = "xoxb-test-token";
    expect(isSlackConfigured()).toBe(true);
    expect(getSlackClient()).not.toBeNull();
  });
});
