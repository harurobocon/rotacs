"use server";

import { revalidatePath } from "next/cache";

import { ActionResult } from "@/types/actions";
import { syncMatchesFromHomepage } from "@/lib/server/matchSync";

export async function importMatchesFromHomepageAction(
  state: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const apiUrl = formData.get("apiUrl")?.toString().trim();
  const result = await syncMatchesFromHomepage(apiUrl);

  if (!result.ok) {
    return {
      errors:
        result.error || "Homepageからの試合情報の取り込みに失敗しました。",
    };
  }

  revalidatePath("/settings/match");
  revalidatePath("/display/match");

  return {
    success: `Homepageから ${result.syncedCount} 件の試合情報を正常に取り込みました。`,
  };
}

export async function updateMatchStatusAction(
  matchId: string,
  newStatus: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { getFirestore } = await import("@/lib/firebase/serverApp");
    const { MATCH_COLLECTION } = await import("@/types/match");
    const db = await getFirestore();
    const docRef = db.collection(MATCH_COLLECTION).doc(matchId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return { ok: false, error: "試合が見つかりませんでした。" };
    }

    const currentData = docSnap.data() as any;
    const now = Date.now();

    let newPhase = currentData?.current_phase || "scheduled";

    if (newStatus === "completed") {
      newPhase = "match_finished";
    } else if (newStatus === "in_progress") {
      newPhase = "match";
    } else if (newStatus === "preparing") {
      newPhase = "preparing";
    } else if (newStatus === "moving") {
      newPhase = "moving";
    } else if (newStatus === "scheduled") {
      newPhase = "scheduled";
    }

    await docRef.set(
      {
        status: newStatus,
        current_phase: newPhase,
        updated_at: now,
      },
      { merge: true },
    );

    revalidatePath("/settings/match");
    revalidatePath("/display/match");

    return { ok: true };
  } catch (err: any) {
    console.error("updateMatchStatusAction error:", err);

    return { ok: false, error: err.toString() };
  }
}

