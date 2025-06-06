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
