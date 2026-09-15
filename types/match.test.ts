import { describe, it, expect } from "vitest";
import { getMatchTeamDisplay } from "./match";

describe("getMatchTeamDisplay", () => {
  it("formats team with pit, team name, and school name (e.g. 08_小金井に城はない / 東京農工大学)", () => {
    const result = getMatchTeamDisplay({
      team_no: 8,
      school_name: "東京農工大学",
      team_name: "小金井に城はない",
      display_name: "08_東京農工大学",
    });

    expect(result.primary).toBe("08_小金井に城はない");
    expect(result.secondary).toBe("東京農工大学");
  });

  it("formats team 3 (03_ロボコンLAB / 埼玉工業大学)", () => {
    const result = getMatchTeamDisplay({
      team_no: 3,
      school_name: "埼玉工業大学",
      team_name: "ロボコンLAB",
      display_name: "03_埼玉工業大学",
    });

    expect(result.primary).toBe("03_ロボコンLAB");
    expect(result.secondary).toBe("埼玉工業大学");
  });

  it("handles when team_name already has prefix", () => {
    const result = getMatchTeamDisplay({
      team_no: 8,
      school_name: "東京農工大学",
      team_name: "08_小金井に城はない",
      display_name: "08_東京農工大学",
    });

    expect(result.primary).toBe("08_小金井に城はない");
    expect(result.secondary).toBe("東京農工大学");
  });

  it("handles when only school_name is present", () => {
    const result = getMatchTeamDisplay({
      team_no: 8,
      school_name: "東京農工大学",
      team_name: "",
      display_name: "08_東京農工大学",
    });

    expect(result.primary).toBe("08_東京農工大学");
    expect(result.secondary).toBe("");
  });

  it("handles null or undefined safely", () => {
    const result = getMatchTeamDisplay(null);

    expect(result.primary).toBe("-");
    expect(result.secondary).toBe("");
  });
});
