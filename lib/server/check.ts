"use server";

import "server-cli-only";

import { sendSlackNotifyMessage } from "./slack";

import {
  CheckReservation,
  CheckStatus,
  CheckSchedule,
  getCheckSides,
} from "@/types/check";
import { getFirestore } from "@/lib/firebase/serverApp";
import { checkDataConverter } from "@/lib/server/converters";
import { getCheckLocationSettings } from "@/lib/server/settings";
import { CHECK1_COLLECTION, CHECK2_COLLECTION } from "@/types/check";
import { getFirestoreUserById } from "@/lib/server/firestoreUserHelpers";

/**
 * Trigger Slack notifications based on the updated Check reservation status.
 * This should be called from the client AFTER writing to Firestore.
 */
export async function triggerCheckNotification(
  collectionId: string,
): Promise<{ ok: boolean; errors?: string }> {
  try {
    // Notify corresponding waiting roles. We just trigger the sequential check.
    await Promise.all([
      sendCall(0, "順番待ち", collectionId),
      sendCall(0, "呼出中", collectionId),
      sendCall(1, "呼出中", collectionId),
      sendCall(2, "呼出中", collectionId),
      sendCall(3, "呼出中", collectionId),
    ]);

    return { ok: true };
  } catch (e: any) {
    console.trace(e.toString());

    return { ok: false, errors: e.toString() };
  }
}

/**
 * Trigger Slack notifications when a new reservation is created.
 * This should be called from the client AFTER creating a reservation if it is the first active reservation.
 */
export async function triggerNewCheckReservationNotification(
  userId: string,
  collectionId: string,
): Promise<{ ok: boolean; errors?: string }> {
  try {
    const booker = await getFirestoreUserById(userId);

    if (booker) {
      await sendNewReservationNotification(booker, collectionId);

      return { ok: true };
    }

    return { ok: false, errors: "User not found" };
  } catch (e: any) {
    console.trace(e.toString());

    return { ok: false, errors: e.toString() };
  }
}

async function sendCall(at: number, status: CheckStatus, collectionId: string) {
  const firestore = await getFirestore();
  const reservationDocs = await firestore
    .collection(collectionId)
    .withConverter(checkDataConverter())
    .get();
  const reservations = reservationDocs.docs.map((doc) => doc.data());

  // 計量計測モード設定を取得して使用するsides配列を決定
  const checkSettings = await getCheckLocationSettings();
  const checkType = collectionId === CHECK1_COLLECTION ? "check1" : "check2";
  const mode = checkSettings[checkType];
  const sides = getCheckSides(mode);

  // modeを渡してスケジュールを作成
  const schedule = CheckSchedule.fromUnsorted(reservations, mode);

  const sidesPromises = sides.map(async (side) => {
    const waiting = schedule.get(side, status);

    if (waiting.length < at + 1) {
      return;
    }

    const targetId = waiting[at];

    const target = await firestore.runTransaction(async (transaction) => {
      const targetRef = firestore
        .collection(collectionId)
        .doc(targetId)
        .withConverter(checkDataConverter());

      let target = await transaction.get(targetRef);

      if (status === "順番待ち" && at === 0 && target.data()?.pre_call_sent) {
        return null;
      } else if (status === "呼出中" && target.data()?.call_sent) {
        return null;
      }

      const update: Partial<CheckReservation> =
        status === "順番待ち" && at === 0
          ? { pre_call_sent: true }
          : { call_sent: true };

      transaction.update(targetRef, update);

      return target.data();
    });

    if (!target) {
      return;
    }

    // 通知先のチャンネル名を決定
    let collectionName = "";

    if (collectionId === CHECK1_COLLECTION) {
      collectionName = "計量計測1";
    } else if (collectionId === CHECK2_COLLECTION) {
      collectionName = "計量計測2";
    }

    // モード設定を取得
    type ReceiverInfo = { receiver: string; side?: string };
    let receivers: ReceiverInfo[] = [];

    if (status === "呼出中") {
      // 呼出中時のみ管理者にも通知
      if (mode === "dual" && target.side !== "ピット") {
        // dualモードの場合は予約のsideに対応するシステムチャンネルに通知
        receivers.push({ receiver: collectionName, side: target.side });
      } else {
        // singleモードの場合はsideなしで通知
        receivers.push({ receiver: collectionName });
      }
    }

    // Replace kysely `db` call with Firestore helper
    const targetUser = await getFirestoreUserById(target.user_id);

    if (targetUser && targetUser.role !== "admin") {
      receivers.push({ receiver: targetUser.display_name });
    }

    // 通知を送信
    const p = receivers.map(({ receiver, side }) => {
      // 通知内容を作成
      let message = "";

      if (status === "呼出中") {
        // 呼び出し通知
        message = `[${target.user_display_name} ${target.reservation_count}回目 ${target.side}] 計量計測の順番になりました．まもなくスタッフが誘導に伺いますので，準備をお願いします．`;
      } else if (status === "順番待ち" && at === 0) {
        // 事前通知
        message = `[${target.user_display_name} ${target.reservation_count}回目] 計量計測が近づいています．呼び出された時に移動できるよう準備をお願いします．
他チームの予約状況により順番が前後することもあるため，順番表を確認してください．
https://${process.env.NEXT_PUBLIC_APP_DOMAIN}/${checkType}`;
      }

      // 通知を送信
      return sendSlackNotifyMessage({
        receiver,
        markdown_text: message,
        at_channel: true,
        side,
      });
    });

    try {
      await Promise.all(p);
    } catch (e: any) {
      console.trace(e.toString());

      // フラグを元に戻す
      const update: Partial<CheckReservation> =
        at === 1 ? { pre_call_sent: false } : { call_sent: false };

      await firestore
        .collection(collectionId)
        .doc(targetId)
        .withConverter(checkDataConverter())
        .update(update);
    }
  });

  await Promise.all(sidesPromises);
}

// Ensure `booker` param type is compatible with what `getFirestoreUserById` returns (e.g., Firestore User object)
async function sendNewReservationNotification(
  // Assuming `booker` has display_name. Adjust type if needed.
  booker: { display_name: string },
  collectionId: string,
) {
  // モード設定を取得
  const checkSettings = await getCheckLocationSettings();
  const checkType = collectionId === CHECK1_COLLECTION ? "check1" : "check2";
  const mode = checkSettings[checkType];

  let collectionName = "";

  if (collectionId === process.env.NEXT_PUBLIC_CHECK1_RESERVATION_COLLECTION) {
    collectionName = "計量計測1";
  } else if (
    collectionId === process.env.NEXT_PUBLIC_CHECK2_RESERVATION_COLLECTION
  ) {
    collectionName = "計量計測2";
  }

  const checkUrl =
    collectionId === process.env.NEXT_PUBLIC_CHECK1_RESERVATION_COLLECTION
      ? "/check1"
      : "/check2";

  const message = `${collectionName}に新規予約[${booker.display_name}]が入りました。実施予定の予約が空の状態からの最初の予約です。予約を確認して実施準備をお願いします。\nhttps://${process.env.NEXT_PUBLIC_APP_DOMAIN}${checkUrl}`;

  try {
    if (mode === "dual") {
      // dualモードの場合は東と西の両方のシステムチャンネルに通知
      await Promise.all([
        sendSlackNotifyMessage({
          receiver: collectionName,
          markdown_text: message,
          at_channel: true,
          side: "東",
        }),
        sendSlackNotifyMessage({
          receiver: collectionName,
          markdown_text: message,
          at_channel: true,
          side: "西",
        }),
      ]);
    } else {
      // singleモードの場合はsideなしで通知
      await sendSlackNotifyMessage({
        receiver: collectionName,
        markdown_text: message,
        at_channel: true,
      });
    }
  } catch (e: any) {
    console.trace(`新規予約通知送信エラー: ${e.toString()}`);
    throw e;
  }
}
