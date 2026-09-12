import "server-cli-only";

import { getFirestore } from "@/lib/firebase/serverApp";
import { MatchData, MATCH_COLLECTION } from "@/types/match";

export async function syncMatchesFromHomepage(apiUrl?: string): Promise<{
  ok: boolean;
  syncedCount: number;
  error?: string;
}> {
  try {
    let targetUrl =
      apiUrl?.trim() ||
      process.env.HOMEPAGE_MATCH_API_URL ||
      process.env.HOMEPAGE_API_URL ||
      "http://localhost:8000/staff/matches/api/list/";

    // If targetUrl is just a base domain/host or doesn't include match list path, append /staff/matches/api/list/
    if (!targetUrl.includes("/matches/api/list/")) {
      const cleanBase = targetUrl.replace(/\/+$/, "");
      targetUrl = `${cleanBase}/staff/matches/api/list/`;
    }

    const res = await fetch(targetUrl, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(
        `Failed to fetch matches from homepage: ${res.status} ${res.statusText}`,
      );
    }

    const rawMatches = await res.json();

    if (!Array.isArray(rawMatches)) {
      throw new Error("Invalid response format from homepage matches API");
    }

    const db = await getFirestore();
    const batch = db.batch();
    const now = Date.now();

    let count = 0;
    for (let i = 0; i < rawMatches.length; i++) {
      const m = rawMatches[i];
      const docId = m.match_id || String(m.id || i + 1);
      const docRef = db.collection(MATCH_COLLECTION).doc(docId);

      const matchData: MatchData = {
        id: docId,
        match_index: i + 1,
        match_id: docId,
        team_red: {
          team_no: m.team_red?.team_no ?? 0,
          school_name: m.team_red?.school_name ?? "",
          team_name: m.team_red?.team_name ?? "",
          display_name:
            m.team_red?.display_name ||
            `${String(m.team_red?.team_no || 0).padStart(2, "0")}_${m.team_red?.school_name || ""}`,
        },
        team_blue: {
          team_no: m.team_blue?.team_no ?? 0,
          school_name: m.team_blue?.school_name ?? "",
          team_name: m.team_blue?.team_name ?? "",
          display_name:
            m.team_blue?.display_name ||
            `${String(m.team_blue?.team_no || 0).padStart(2, "0")}_${m.team_blue?.school_name || ""}`,
        },
        status: m.status || "scheduled",
        score_red: m.score_red ?? 0,
        score_blue: m.score_blue ?? 0,
        winner_side: m.winner_side ?? "none",
        current_phase: m.status === "completed" ? "match_finished" : "scheduled",
        pre_call_sent: false,
        move_call_sent: false,
        updated_at: now,
      };

      batch.set(docRef, matchData, { merge: true });
      count++;
    }

    await batch.commit();
    return { ok: true, syncedCount: count };
  } catch (err: any) {
    console.error("syncMatchesFromHomepage error:", err);
    return { ok: false, syncedCount: 0, error: err.toString() };
  }
}
