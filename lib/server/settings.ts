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
} from "@/types/settings";
import { getFirestore } from "@/lib/firebase/serverApp";
import { validateRequest } from "@/lib/server/auth";

export async function updateReservationSettings(
  prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { user } = await validateRequest();

  if (!user || user.role !== "admin") {
    return { errors: "権限がありません" };
  }

  try {
    const settings = {} as ReservationSettings;

    for (const type of RESERVATION_TYPES) {
      const mode = formData.get(`${type}-mode`) as ReservationControlMode;
      const startTime = formData.get(`${type}-startTime`) as string;

      if (!RESERVATION_CONTROL_MODES.includes(mode)) {
        return { errors: `無効なモードが${type}に設定されています` };
      }

      settings[type] = { mode, startTime: startTime || "09:00" };
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
