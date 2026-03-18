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
  CHECK_ITEMS_SETTINGS_COLLECTION,
  CHECK_ITEMS_SETTINGS_DOCUMENT_ID,
  CheckItemsSettings,
  CheckItemSetting,
  CHECK_ITEM_TYPES,
  DEFAULT_CHECK_ITEM_SETTINGS,
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
      const allowRobotCheckInputDefault =
        DEFAULT_RESERVATION_CONDITIONS.allowRobotCheckInput ?? false;
      const allowRobotCheckInput =
        type === "testrun"
          ? resolveConditionEnabled(
              "allowRobotCheckInput",
              parseBooleanFormValue(
                formData,
                `${type}-allowRobotCheckInput`,
                allowRobotCheckInputDefault,
              ),
            )
          : false;
      const requireRobotCheckOnFirstTestrunDefault =
        DEFAULT_RESERVATION_CONDITIONS.requireRobotCheckOnFirstTestrun ?? false;
      const requireRobotCheckOnFirstTestrun =
        type === "testrun"
          ? resolveConditionEnabled(
              "requireRobotCheckOnFirstTestrun",
              parseBooleanFormValue(
                formData,
                `${type}-requireRobotCheckOnFirstTestrun`,
                requireRobotCheckOnFirstTestrunDefault,
              ),
            )
          : false;

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
          ...(type === "testrun"
            ? {
                allowRobotCheckInput,
                requireRobotCheckOnFirstTestrun,
              }
            : {}),
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

function normalizeAndValidateItems(items: unknown): {
  items: CheckItemSetting[];
  error?: string;
} {
  if (!Array.isArray(items)) {
    return { items: [], error: "確認項目の形式が不正です" };
  }

  const normalized: CheckItemSetting[] = [];
  const seenIds = new Set<string>();

  for (let i = 0; i < items.length; i += 1) {
    const item = items[i] as Partial<CheckItemSetting>;

    if (
      typeof item?.id !== "string" ||
      item.id.trim().length === 0 ||
      !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(item.id)
    ) {
      return { items: [], error: `項目IDが不正です (${i + 1}件目)` };
    }

    if (seenIds.has(item.id)) {
      return { items: [], error: `項目IDが重複しています: ${item.id}` };
    }

    if (typeof item?.label !== "string" || item.label.trim().length === 0) {
      return { items: [], error: `項目ラベルが不正です (${i + 1}件目)` };
    }

    if (
      !CHECK_ITEM_TYPES.includes(String(item.type) as CheckItemSetting["type"])
    ) {
      return { items: [], error: `項目タイプが不正です (${i + 1}件目)` };
    }

    seenIds.add(item.id);
    normalized.push({
      id: item.id.trim(),
      label: item.label.trim(),
      type: item.type as CheckItemSetting["type"],
      order: Number.isFinite(item.order) ? Number(item.order) : i,
      enabled: item.enabled !== false,
    });
  }

  normalized.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));

  return {
    items: normalized.map((item, index) => ({
      ...item,
      order: index,
    })),
  };
}

export async function updateCheckItemsSettings(
  prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  // Note: Authentication and authorization are handled by Firestore Rules
  // Admin-only access is enforced by the rule: allow write: if isAdmin();

  try {
    const raw = formData.get("checkItemsSettings");

    if (typeof raw !== "string" || raw.trim().length === 0) {
      return { errors: "確認項目のデータが送信されていません" };
    }

    let parsed: Partial<CheckItemsSettings>;

    try {
      parsed = JSON.parse(raw) as Partial<CheckItemsSettings>;
    } catch (_error) {
      return { errors: "確認項目のデータ形式が不正です" };
    }

    const check1Validation = normalizeAndValidateItems(
      parsed.check1 ?? DEFAULT_CHECK_ITEM_SETTINGS.check1,
    );

    if (check1Validation.error) {
      return { errors: `計量計測1: ${check1Validation.error}` };
    }

    const check2Validation = normalizeAndValidateItems(
      parsed.check2 ?? DEFAULT_CHECK_ITEM_SETTINGS.check2,
    );

    if (check2Validation.error) {
      return { errors: `計量計測2: ${check2Validation.error}` };
    }

    const settings: CheckItemsSettings = {
      check1: check1Validation.items,
      check2: check2Validation.items,
    };

    const db = await getFirestore();
    const settingsRef = db
      .collection(CHECK_ITEMS_SETTINGS_COLLECTION)
      .doc(CHECK_ITEMS_SETTINGS_DOCUMENT_ID);

    await settingsRef.set(settings);

    revalidatePath("/settings/check-mode");
    revalidatePath("/check1");
    revalidatePath("/check2");

    return { success: "確認項目設定を保存しました" };
  } catch (e: any) {
    console.error(e);

    return { errors: "確認項目設定の更新に失敗しました" };
  }
}
