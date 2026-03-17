"use server";

import "server-cli-only";

import { sendSlackNotifyMessage } from "./slack";

import {
  TestrunReservation,
  TestrunStatus,
  TESTRUN_COLLECTION,
  TestrunSchedule,
  TestrunSides,
} from "@/types/testrun";
import { getFirestore } from "@/lib/firebase/serverApp";
import { testrunDataConverter } from "@/lib/server/converters";
import { getFirestoreUserById } from "@/lib/server/firestoreUserHelpers";

/**
 * Trigger Slack notifications based on the updated Testrun status.
 * This should be called from the client AFTER writing to Firestore.
 */
export async function triggerTestrunNotification(): Promise<{
  ok: boolean;
  errors?: string;
}> {
  try {
    // Notify corresponding waiting roles. We just trigger the sequential check.
    await Promise.all([
      sendCall(0, "順番待ち"),
      sendCall(0, "呼出中"),
      sendCall(1, "呼出中"),
      sendCall(2, "呼出中"),
      sendCall(3, "呼出中"),
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
export async function triggerNewTestrunReservationNotification(
  userId: string,
): Promise<{ ok: boolean; errors?: string }> {
  try {
    const booker = await getFirestoreUserById(userId);

    if (booker) {
      await sendNewReservationNotification(booker);

      return { ok: true };
    }

    return { ok: false, errors: "User not found" };
  } catch (e: any) {
    console.trace(e.toString());

    return { ok: false, errors: e.toString() };
  }
}

// Ensure `booker` param type is compatible with what `getFirestoreUserById` returns (e.g., Firestore User object)
async function sendNewReservationNotification(
  // Assuming `booker` has display_name. Adjust type if needed.
  booker: { display_name: string },
) {
  const collectionName = "テストラン";
  const message = `${collectionName}に新規予約[${booker.display_name}]が入りました。実施予定の予約が空の状態からの最初の予約です。予約を確認して実施準備をお願いします。\nhttps://${process.env.NEXT_PUBLIC_APP_DOMAIN}/testrun`;

  try {
    await sendSlackNotifyMessage({
      receiver: collectionName,
      markdown_text: message,
      at_channel: true,
    });
  } catch (e: any) {
    console.trace(`新規予約通知送信エラー: ${e.toString()}`);
    throw e;
  }
}

// 「順番待ち」の先頭からat番目のテストランに呼び出し予告を送信する
async function sendCall(at: number, status: TestrunStatus) {
  const firestore = await getFirestore();
  const reservationDocs = await firestore
    .collection(TESTRUN_COLLECTION)
    .withConverter(testrunDataConverter())
    .get();
  const reservations = reservationDocs.docs.map((doc) => doc.data());
  const schedule = TestrunSchedule.fromUnsorted(reservations);

  const sidesPromises = TestrunSides.map(async (side) => {
    // 通知対象のテストランを取得
    const waiting = schedule.get(side, status);

    if (waiting.length < at + 1) {
      return;
    }

    const targetId = waiting[at];

    const target = await firestore.runTransaction(async (transaction) => {
      const targetRef = firestore
        .collection(TESTRUN_COLLECTION)
        .doc(targetId)
        .withConverter(testrunDataConverter());

      let target = await transaction.get(targetRef);

      if (status === "順番待ち" && at === 0 && target.data()?.pre_call_sent) {
        return null;
      } else if (status === "呼出中" && target.data()?.call_sent) {
        return null;
      }

      const update: Partial<TestrunReservation> =
        status === "順番待ち" && at === 0
          ? { pre_call_sent: true }
          : { call_sent: true };

      transaction.update(targetRef, update);

      return target.data();
    });

    if (!target) {
      return;
    }

    // 送信先のユーザIDをリストアップ
    let receivers: string[] = [];

    if (status === "呼出中") {
      receivers.push(`${target.side}テストラン`);
    }

    // Replace kysely `db` call with Firestore helper
    const targetUser = await getFirestoreUserById(target.user_id);

    // Assuming the TargetUser from Firestore represents user data similar to previous Kysely UserTable.
    // Ensure getFirestoreUserById correctly returns the role and display_name
    if (targetUser && targetUser.role !== "admin") {
      receivers.push(targetUser.display_name);
    }

    // 通知を送信
    const p = receivers.map((receiver) => {
      // 通知内容を作成
      let message = "";

      if (status === "呼出中") {
        // 呼び出し通知
        message = `[${target.user_display_name} ${target.reservation_count}回目 ${target.side}] テストランの順番になりました．まもなくスタッフが誘導に伺いますので，準備をお願いします．`;
      } else if (status === "順番待ち" && at === 0) {
        // 事前通知
        message = `[${target.user_display_name} ${target.reservation_count}回目 ${target.side}] テストランが近づいています．呼び出された時に移動できるよう準備をお願いします．
他チームの予約状況により順番が前後することもあるため，テストラン一覧を確認してください．
https://${process.env.NEXT_PUBLIC_APP_DOMAIN}/testrun`;
      }

      // 通知を送信
      return sendSlackNotifyMessage({
        receiver,
        markdown_text: message,
        at_channel: true,
      });
    });

    try {
      await Promise.all(p);
    } catch (e: any) {
      console.trace(e.toString());

      // フラグを元に戻す
      const update: Partial<TestrunReservation> =
        status === "順番待ち" && at === 0
          ? { pre_call_sent: false }
          : { call_sent: false };

      await firestore
        .collection(TESTRUN_COLLECTION)
        .doc(targetId)
        .withConverter(testrunDataConverter())
        .update(update);
    }
  });

  await Promise.all(sidesPromises);
}
