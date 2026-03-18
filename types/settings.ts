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
  conditions: ReservationConditionSettings;
}

export interface ReservationConditionSettings {
  preventDuplicateReservation: boolean;
  requireCheck1Pass?: boolean;
}

export interface ReservationGlobalSettings {
  adminBypassEnabled: boolean;
}

export type ReservationConditionKey = keyof ReservationConditionSettings;

export type ReservationConditionFallbackMap = {
  [type in ReservationType]: {
    [key in ReservationConditionKey]: boolean;
  };
};

export const DEFAULT_RESERVATION_CONDITIONS = {
  preventDuplicateReservation: true,
  requireCheck1Pass: true,
} as const satisfies Required<ReservationConditionSettings>;

export const DEFAULT_RESERVATION_GLOBAL_SETTINGS: ReservationGlobalSettings = {
  adminBypassEnabled: true,
};

export function getConditionDefaultValue(key: ReservationConditionKey): boolean {
  return DEFAULT_RESERVATION_CONDITIONS[key];
}

export function resolveConditionEnabled(
  key: ReservationConditionKey,
  value: boolean | null | undefined,
): boolean {
  if (value === null || value === undefined) {
    return getConditionDefaultValue(key);
  }

  return value;
}

export function resolveAdminBypassEnabled(
  value: boolean | null | undefined,
): boolean {
  if (value === null || value === undefined) {
    return DEFAULT_RESERVATION_GLOBAL_SETTINGS.adminBypassEnabled;
  }

  return value;
}

export type ReservationSettings = {
  [key in ReservationType]: ReservationControlSetting;
} & {
  global: ReservationGlobalSettings;
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
