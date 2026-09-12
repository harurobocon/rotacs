export interface MatchTeamInfo {
  team_no: number;
  school_name: string;
  team_name: string;
  display_name: string; // e.g. "01_旭川"
}

export type MatchCallingStatus = "scheduled" | "preparing" | "moving" | "in_progress" | "completed";

export interface MatchData {
  id: string; // Document ID (e.g. "1" or "MA-1")
  match_index: number; // Order index (1, 2, 3...)
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
  match_id?: string;
  current_phase?: string; // e.g. "preparing", "setting", "match", "match_finished"
  team_red?: Partial<MatchTeamInfo>;
  team_blue?: Partial<MatchTeamInfo>;
  is_confirmed?: boolean;
}

export const MATCH_COLLECTION = process.env.NEXT_PUBLIC_MATCH_COLLECTION || "matches";
