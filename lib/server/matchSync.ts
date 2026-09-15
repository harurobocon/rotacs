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
      "https://kantouharurobo.com/staff/matches/api/list/";

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

    // 既存の試合データを取得して、RoTACS側で進行中のステータスや呼出フラグを保護する
    const existingSnapshot = await db.collection(MATCH_COLLECTION).get();
    const existingMap = new Map<string, MatchData>();

    existingSnapshot.forEach((doc) => {
      existingMap.set(doc.id, doc.data() as MatchData);
    });

    const batch = db.batch();
    const now = Date.now();

    let count = 0;

    for (let i = 0; i < rawMatches.length; i++) {
      const m = rawMatches[i];
      const docId = m.match_id || String(m.id || i + 1);
      const docRef = db.collection(MATCH_COLLECTION).doc(docId);
      const existing = existingMap.get(docId);

      const matchNo =
        typeof m.match_no === "number" && m.match_no > 0 ? m.match_no : i + 1;

      // 試合状態（ステータス）の判定と保護
      // Homepage側で completed の場合は完了とする
      // Homepage側が scheduled の場合でも、RoTACS側ですでに進行中・移動中・準備中・完了だった場合は維持する
      let status = m.status || "scheduled";
      let currentPhase =
        m.status === "completed" ? "match_finished" : "scheduled";
      let preCallSent = false;
      let moveCallSent = false;

      if (m.status === "completed") {
        status = "completed";
        currentPhase = "match_finished";
        preCallSent = existing?.pre_call_sent ?? true;
        moveCallSent = existing?.move_call_sent ?? true;
      } else if (existing) {
        // 既存の進行中や呼び出し状態を保護
        status = existing.status || m.status || "scheduled";
        currentPhase =
          existing.current_phase && existing.current_phase !== "scheduled"
            ? existing.current_phase
            : currentPhase;
        preCallSent = existing.pre_call_sent ?? false;
        moveCallSent = existing.move_call_sent ?? false;
      }

      const matchData: MatchData = {
        id: docId,
        match_index: matchNo,
        match_no: matchNo,
        match_id: docId,
        team_red: {
          team_no: m.team_red?.team_no ?? existing?.team_red?.team_no ?? 0,
          school_name:
            m.team_red?.school_name || existing?.team_red?.school_name || "",
          team_name:
            m.team_red?.team_name || existing?.team_red?.team_name || "",
          display_name:
            m.team_red?.display_name ||
            existing?.team_red?.display_name ||
            `${String(m.team_red?.team_no || 0).padStart(2, "0")}_${m.team_red?.school_name || ""}`,
        },
        team_blue: {
          team_no: m.team_blue?.team_no ?? existing?.team_blue?.team_no ?? 0,
          school_name:
            m.team_blue?.school_name || existing?.team_blue?.school_name || "",
          team_name:
            m.team_blue?.team_name || existing?.team_blue?.team_name || "",
          display_name:
            m.team_blue?.display_name ||
            existing?.team_blue?.display_name ||
            `${String(m.team_blue?.team_no || 0).padStart(2, "0")}_${m.team_blue?.school_name || ""}`,
        },
        status,
        score_red: m.score_red ?? existing?.score_red ?? 0,
        score_blue: m.score_blue ?? existing?.score_blue ?? 0,
        winner_side: m.winner_side ?? existing?.winner_side ?? "none",
        current_phase: currentPhase,
        pre_call_sent: preCallSent,
        move_call_sent: moveCallSent,
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
