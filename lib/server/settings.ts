"use server";

import { revalidatePath } from "next/cache";

import { ActionResult } from "@/types/actions";
import {
  RESERVATION_CONTROL_MODES,
  RESERVATION_SETTINGS_COLLECTION,
  RESERVATION_SETTINGS_DOCUMENT_ID,
  RESERVATION_TYPES,
  ReservationSettings,
  ReservationControlMode,
  DEFAULT_RESERVATION_CONDITIONS,
  DEFAULT_RESERVATION_GLOBAL_SETTINGS,
  resolveConditionEnabled,
  resolveAdminBypassEnabled,
  CHECK_LOCATION_SETTINGS_COLLECTION,
  CHECK_LOCATION_SETTINGS_DOCUMENT_ID,
  CheckLocationSettings,
  CHECK_LOCATION_MODES,
  CheckLocationMode,
} from "@/types/settings";
import { getFirestore } from "@/lib/firebase/serverApp";

function parseBooleanFormValue(
  formData: FormData,
  key: string,
  defaultValue: boolean,
): boolean {
  const raw = formData.get(key);

  if (raw === null) {
    return defaultValue;
  }

  const value = String(raw).toLowerCase();

  return value === "true" || value === "1" || value === "on";
}

export async function updateReservationSettings(
  prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  // Note: Authentication and authorization are handled by Firestore Rules
  // Admin-only access is enforced by the rule: allow write: if isAdmin();

  try {
    const settings = {
      global: {
        adminBypassEnabled: resolveAdminBypassEnabled(
          parseBooleanFormValue(
            formData,
            "global-adminBypassEnabled",
            DEFAULT_RESERVATION_GLOBAL_SETTINGS.adminBypassEnabled,
          ),
        ),
      },
    } as ReservationSettings;

    for (const type of RESERVATION_TYPES) {
      const mode = formData.get(`${type}-mode`) as ReservationControlMode;
      const startDate = formData.get(`${type}-startDate`) as string;
      const startTime = formData.get(`${type}-startTime`) as string;
      const preventDuplicateReservation = resolveConditionEnabled(
        "preventDuplicateReservation",
        parseBooleanFormValue(
          formData,
          `${type}-preventDuplicateReservation`,
          DEFAULT_RESERVATION_CONDITIONS.preventDuplicateReservation,
        ),
      );
      const requireCheck1PassDefault =
        DEFAULT_RESERVATION_CONDITIONS.requireCheck1Pass ?? true;
      const requireCheck1Pass =
        type === "check1"
          ? false
          : resolveConditionEnabled(
              "requireCheck1Pass",
              parseBooleanFormValue(
                formData,
                `${type}-requireCheck1Pass`,
                requireCheck1PassDefault,
              ),
            );

      if (!RESERVATION_CONTROL_MODES.includes(mode)) {
        return { errors: `無効なモードが${type}に設定されています` };
      }

      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");

      settings[type] = {
        mode,
        startDate: startDate || `${year}-${month}-${day}`,
        startTime: startTime || "09:00",
        conditions: {
          preventDuplicateReservation,
          ...(type === "check1" ? {} : { requireCheck1Pass }),
        },
      };
    }

    const db = await getFirestore();
    const settingsRef = db
      .collection(RESERVATION_SETTINGS_COLLECTION)
      .doc(RESERVATION_SETTINGS_DOCUMENT_ID);

    await settingsRef.set(settings);

    revalidatePath("/settings/reservations/control");
    revalidatePath("/check1/new");
    revalidatePath("/check2/new");
    revalidatePath("/practice/new");
    revalidatePath("/testrun/new");

    return {};
  } catch (e: any) {
    console.error(e);

    return { errors: "設定の更新に失敗しました" };
  }
}

export async function updateCheckLocationSettings(
  prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  // Note: Authentication and authorization are handled by Firestore Rules
  // Admin-only access is enforced by the rule: allow write: if isAdmin();

  try {
    const check1 = formData.get("check1") as CheckLocationMode;
    const check2 = formData.get("check2") as CheckLocationMode;

    if (
      !CHECK_LOCATION_MODES.includes(check1) ||
      !CHECK_LOCATION_MODES.includes(check2)
    ) {
      return { errors: "無効なモードが設定されています" };
    }

    const settings: CheckLocationSettings = {
      check1,
      check2,
    };

    const db = await getFirestore();
    const settingsRef = db
      .collection(CHECK_LOCATION_SETTINGS_COLLECTION)
      .doc(CHECK_LOCATION_SETTINGS_DOCUMENT_ID);

    await settingsRef.set(settings);

    revalidatePath("/settings/check-mode");
    revalidatePath("/check1");
    revalidatePath("/check1/new");
    revalidatePath("/check2");
    revalidatePath("/check2/new");

    return { success: "設定を保存しました" };
  } catch (e: any) {
    console.error(e);

    return { errors: "設定の更新に失敗しました" };
  }
}

export async function getCheckLocationSettings(): Promise<CheckLocationSettings> {
  const db = await getFirestore();
  const settingsRef = db
    .collection(CHECK_LOCATION_SETTINGS_COLLECTION)
    .doc(CHECK_LOCATION_SETTINGS_DOCUMENT_ID);

  const doc = await settingsRef.get();

  if (doc.exists) {
    return doc.data() as CheckLocationSettings;
  } else {
    // デフォルト設定を返す
    return {
      check1: "single",
      check2: "single",
    };
  }
}
