import "server-cli-only";

import { getFirestore } from "@/lib/firebase/serverApp";
import { MatchData, RoLIMOAStatusPayload, MATCH_COLLECTION } from "@/types/match";
import {
  sendMatchPreCallNotification,
  sendMatchMoveCallNotification,
} from "./matchSlack";

/**
 * 全試合リストを match_index 順で取得する
 */
export async function getAllMatches(): Promise<MatchData[]> {
  const db = await getFirestore();
  const snapshot = await db
    .collection(MATCH_COLLECTION)
    .orderBy("match_index", "asc")
    .get();

  return snapshot.docs.map((doc) => doc.data() as MatchData);
}

/**
 * RoLIMOAからのステータス更新Webhookを受信・処理する
 */
export async function processRoLIMOAStatusUpdate(
  payload: RoLIMOAStatusPayload,
): Promise<{ ok: boolean; message?: string; errors?: string }> {
  try {
    const db = await getFirestore();
    const matches = await getAllMatches();

    if (matches.length === 0) {
      return {
        ok: false,
        errors: "Firestore matches collection is empty. Run schedule sync first.",
      };
    }

    // 現在進行中/選択された試合を特定（match_index または match_id）
    let currentMatchIndex = payload.match_index;

    if (!currentMatchIndex && payload.match_id) {
      const found = matches.find((m) => m.match_id === payload.match_id || m.id === payload.match_id);
      if (found) {
        currentMatchIndex = found.match_index;
      }
    }

    // デフォルトで最初、または一致する試合
    if (!currentMatchIndex || currentMatchIndex < 1) {
      currentMatchIndex = 1;
    }

    const now = Date.now();
    const currentPhase = payload.current_phase || "in_progress";

    // 1. 現在の試合 (Match N) の更新
    const currentMatchDoc = matches.find((m) => m.match_index === currentMatchIndex);
    if (currentMatchDoc) {
      const isFinished = currentPhase === "match_finished" || payload.is_confirmed;
      const updateData: Partial<MatchData> = {
        current_phase: currentPhase,
        status: isFinished ? "completed" : "in_progress",
        updated_at: now,
      };

      if (payload.team_red?.school_name) {
        updateData.team_red = { ...currentMatchDoc.team_red, ...payload.team_red };
      }
      if (payload.team_blue?.school_name) {
        updateData.team_blue = { ...currentMatchDoc.team_blue, ...payload.team_blue };
      }

      await db
        .collection(MATCH_COLLECTION)
        .doc(currentMatchDoc.id)
        .set(updateData, { merge: true });
    }

    // 2. 2試合前 (Match N+2) の「コート移動要請」チェックと通知
    // 現在の試合(N)進行中、または試合間に N+2 のチームへ移動要請を行う
    const moveMatchIndex = currentMatchIndex + 2;
    const moveMatch = matches.find((m) => m.match_index === moveMatchIndex);

    if (moveMatch && !moveMatch.move_call_sent) {
      await db
        .collection(MATCH_COLLECTION)
        .doc(moveMatch.id)
        .set(
          {
            status: "moving",
            move_call_sent: true,
            updated_at: now,
          },
          { merge: true },
        );

      await sendMatchMoveCallNotification({
        ...moveMatch,
        status: "moving",
        move_call_sent: true,
      });
    }

    // 3. 3試合前 (Match N+3) の「移動準備呼びかけ」チェックと通知
    const preCallMatchIndex = currentMatchIndex + 3;
    const preCallMatch = matches.find((m) => m.match_index === preCallMatchIndex);

    if (preCallMatch && !preCallMatch.pre_call_sent) {
      await db
        .collection(MATCH_COLLECTION)
        .doc(preCallMatch.id)
        .set(
          {
            status: "preparing",
            pre_call_sent: true,
            updated_at: now,
          },
          { merge: true },
        );

      await sendMatchPreCallNotification({
        ...preCallMatch,
        status: "preparing",
        pre_call_sent: true,
      });
    }

    return {
      ok: true,
      message: `Processed status update for match ${currentMatchIndex} (${currentPhase})`,
    };
  } catch (err: any) {
    console.error("processRoLIMOAStatusUpdate error:", err);
    return { ok: false, errors: err.toString() };
  }
}
