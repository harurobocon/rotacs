export const RESERVATION_TYPES = [
  "check1",
  "check2",
  "practice",
  "testrun",
] as const;
export type ReservationType = (typeof RESERVATION_TYPES)[number];

export const RESERVATION_CONTROL_MODES = [
  "timer",
  "enabled",
  "disabled",
] as const;
export type ReservationControlMode = (typeof RESERVATION_CONTROL_MODES)[number];

export interface ReservationControlSetting {
  mode: ReservationControlMode;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
}

export type ReservationSettings = {
  [key in ReservationType]: ReservationControlSetting;
};

export const RESERVATION_SETTINGS_COLLECTION =
  process.env.NEXT_PUBLIC_RESERVATION_SETTINGS_COLLECTION ||
  "reservation_settings_dev";
export const RESERVATION_SETTINGS_DOCUMENT_ID =
  process.env.NEXT_PUBLIC_RESERVATION_SETTINGS_DOCUMENT_ID || "main";

// 計量計測モード設定
export const CHECK_LOCATION_MODES = ["single", "dual"] as const;
export type CheckLocationMode = (typeof CHECK_LOCATION_MODES)[number];

export interface CheckLocationSettings {
  check1: CheckLocationMode;
  check2: CheckLocationMode;
}

export const CHECK_LOCATION_SETTINGS_COLLECTION =
  process.env.NEXT_PUBLIC_CHECK_LOCATION_SETTINGS_COLLECTION ||
  "check_location_settings_dev";
export const CHECK_LOCATION_SETTINGS_DOCUMENT_ID =
  process.env.NEXT_PUBLIC_CHECK_LOCATION_SETTINGS_DOCUMENT_ID || "main";

// システムSlackチャンネルID保存用のドキュメントID
// RESERVATION_SETTINGS_COLLECTIONを使用し、別ドキュメントとして保存
export const SYSTEM_SLACK_CHANNELS_DOCUMENT_ID = "system_slack_channels";
