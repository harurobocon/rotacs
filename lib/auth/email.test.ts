import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getAppDomain, usernameToEmail, emailToUsername } from "./email";

describe("lib/auth/email", () => {
  const originalEnv = process.env.NEXT_PUBLIC_APP_DOMAIN;

  afterEach(() => {
    process.env.NEXT_PUBLIC_APP_DOMAIN = originalEnv;
  });

  describe("getAppDomain", () => {
    it("環境変数が未設定の場合はデフォルトドメインを返す", () => {
      delete process.env.NEXT_PUBLIC_APP_DOMAIN;
      expect(getAppDomain()).toBe("rotacs.kantouharurobo.com");
    });

    it("設定されたドメインをそのまま返す", () => {
      process.env.NEXT_PUBLIC_APP_DOMAIN = "rotacs.kantouharurobo.com";
      expect(getAppDomain()).toBe("rotacs.kantouharurobo.com");
    });

    it("https:// や末尾スラッシュを除去して正規化する", () => {
      process.env.NEXT_PUBLIC_APP_DOMAIN = "https://rotacs.kantouharurobo.com/";
      expect(getAppDomain()).toBe("rotacs.kantouharurobo.com");
    });

    it("パスが含まれる場合もドメイン部分のみを抽出する", () => {
      process.env.NEXT_PUBLIC_APP_DOMAIN = "http://rotacs.example.com/some/path";
      expect(getAppDomain()).toBe("rotacs.example.com");
    });
  });

  describe("usernameToEmail", () => {
    it("ユーザー名とドメインを結合してメールアドレスを生成する", () => {
      process.env.NEXT_PUBLIC_APP_DOMAIN = "rotacs.kantouharurobo.com";
      expect(usernameToEmail("admin")).toBe("admin@rotacs.kantouharurobo.com");
      expect(usernameToEmail("staff01")).toBe("staff01@rotacs.kantouharurobo.com");
    });
  });

  describe("emailToUsername", () => {
    it("メールアドレスからユーザー名を取得する", () => {
      expect(emailToUsername("admin@rotacs.kantouharurobo.com")).toBe("admin");
      expect(emailToUsername("staff01@rotacs.yuchi.jp")).toBe("staff01");
    });
  });
});
