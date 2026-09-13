import { describe, it, expect } from "vitest";

import { formatCallingAnnouncement } from "../voice-announcement";

describe("voice-announcement formatCallingAnnouncement", () => {
  it("ピット番号が存在する場合「チーム{番号} 移動してください」を生成する", () => {
    const text = formatCallingAnnouncement(1, "テスト高専A");

    expect(text).toBe("チーム1 移動してください");
  });

  it("大きなピット番号でも正しく生成する", () => {
    const text = formatCallingAnnouncement(24, "サンプル大学");

    expect(text).toBe("チーム24 移動してください");
  });

  it("ピット番号が0または未指定の場合、チーム名を用いて生成する", () => {
    const text1 = formatCallingAnnouncement(0, "旭川ロボットクラブ");

    expect(text1).toBe("旭川ロボットクラブ 移動してください");

    const text2 = formatCallingAnnouncement(null, "早稲田");

    expect(text2).toBe("早稲田 移動してください");

    const text3 = formatCallingAnnouncement(undefined, "東工大");

    expect(text3).toBe("東工大 移動してください");
  });

  it("ピット番号もチーム名も空の場合のフォールバック", () => {
    const text = formatCallingAnnouncement(null, "");

    expect(text).toBe("移動してください");
  });
});
