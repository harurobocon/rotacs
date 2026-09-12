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
      errors: result.error || "Homepageからの試合情報の取り込みに失敗しました。",
    };
  }

  revalidatePath("/settings/match");
  revalidatePath("/display/match");

  return {
    success: `Homepageから ${result.syncedCount} 件の試合情報を正常に取り込みました。`,
  };
}
