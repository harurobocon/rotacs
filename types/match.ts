export interface MatchTeamInfo {
  team_no: number;
  school_name: string;
  team_name: string;
  display_name: string; // e.g. "01_旭川"
}

export type MatchCallingStatus =
  | "scheduled"
  | "preparing"
  | "moving"
  | "in_progress"
  | "completed";

export interface MatchData {
  id: string; // Document ID (e.g. "1" or "MA-1")
  match_index: number; // Order index (1, 2, 3...)
  match_no: number; // Official match number according to schedule order
  match_id: string; // e.g. "MA-1", "MK-1"
  team_red: MatchTeamInfo;
  team_blue: MatchTeamInfo;
  status: MatchCallingStatus;
  score_red?: number;
  score_blue?: number;
  winner_side?: string;
  current_phase?: string; // RoLIMOA phase e.g. "preparing", "setting", "match", "match_finished"
  pre_call_sent: boolean; // Sent for 3 matches ahead (移動準備)
  move_call_sent: boolean; // Sent for 2 matches ahead (コート移動)
  updated_at: number; // Unix timestamp
}

export interface RoLIMOAStatusPayload {
  match_index?: number;
  match_no?: number;
  match_id?: string;
  current_phase?: string; // e.g. "preparing", "setting", "match", "match_finished"
  team_red?: Partial<MatchTeamInfo>;
  team_blue?: Partial<MatchTeamInfo>;
  is_confirmed?: boolean;
}

export const MATCH_COLLECTION =
  process.env.NEXT_PUBLIC_MATCH_COLLECTION || "matches";

/**
 * 試合呼び出し画面や一覧表示用のチーム名表示を整形
 * 上段（主表示）: "08_小金井に城はない"（ピット番号 + チーム名）
 * 下段（副表示）: "東京農工大学"（学校名）
 */
export function getMatchTeamDisplay(team?: Partial<MatchTeamInfo> | null): {
  primary: string;
  secondary: string;
} {
  if (!team) return { primary: "-", secondary: "" };

  const padNo =
    typeof team.team_no === "number" && team.team_no > 0
      ? String(team.team_no).padStart(2, "0")
      : "";

  const rawTeamName = team.team_name?.trim() || "";
  const rawSchoolName = team.school_name?.trim() || "";
  const rawDisplayName = team.display_name?.trim() || "";

  // 上段: チーム名（ロボット名）を最優先。なければ学校名、それもなければ display_name
  let primaryName = rawTeamName;

  if (!primaryName) {
    primaryName =
      rawSchoolName ||
      (padNo
        ? rawDisplayName.replace(new RegExp(`^${padNo}_`), "")
        : rawDisplayName);
  }

  let primary = primaryName;

  if (padNo) {
    primary = primaryName.startsWith(`${padNo}_`)
      ? primaryName
      : `${padNo}_${primaryName}`;
  }

  // 下段: 学校名
  let secondary = rawSchoolName;

  if (!secondary) {
    const cleanDisplay = padNo
      ? rawDisplayName.replace(new RegExp(`^${padNo}_`), "")
      : rawDisplayName;

    if (cleanDisplay && cleanDisplay !== primaryName) {
      secondary = cleanDisplay;
    }
  }

  // 主表示と重複する場合は下段を空にする
  if (
    secondary &&
    (secondary === primary || (padNo && `${padNo}_${secondary}` === primary))
  ) {
    secondary = "";
  }

  return { primary: primary || "-", secondary };
}

