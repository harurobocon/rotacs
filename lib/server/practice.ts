"use server";

import "server-cli-only";

import { FirestoreDataConverter } from "firebase-admin/firestore";
import { User } from "lucia";

import {
  PracticeReservation,
  PracticeSide,
  PracticeStatus,
  PRACTICE_COLLECTION,
  PracticeSchedule,
  PracticeSides,
} from "@/types/practice";
import { ActionResult } from "@/types/actions";
import { getFirestore } from "@/lib/firebase/serverApp";
import { validateRequest } from "@/lib/server/auth";
import {
  reservationDataConverter,
  validateFormData as _validateFormData,
} from "@/lib/server/reservation";
import { practiceDataConverter } from "@/lib/server/converters";
import { db } from "@/lib/server/db";
import { sendLineNotifyMessage } from "@/lib/server/line-notify";

export async function validateFormData(formData: FormData, currentUser: User) {
  let { side, booker } = await _validateFormData<PracticeSide>(
    formData,
    currentUser,
  );

  if (!side) {
    throw Error("エリアが指定されていません");
  }

  return { side, booker };
}

export async function createPractice(
  state: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { user: currentUser } = await validateRequest();

  if (!currentUser) {
    console.trace("認証情報が不正です．ログインし直してください．");

    return { errors: "認証情報が不正です．ログインしなおしてください" };
  }

  let side: PracticeSide;
  let booker: User;

  try {
    ({ side, booker } = await validateFormData(formData, currentUser));
  } catch (e: any) {
    return { errors: e.toString() };
  }

  try {
    const firestore = await getFirestore();
    const retryCount = 0;

    const result = await firestore.runTransaction(async (transaction) => {
      if (retryCount > 0) {
        console.log(
          `[${booker.display_name}] createPractice retry: ${retryCount}`,
        );
      }

      const collection = firestore
        .collection(PRACTICE_COLLECTION)
        .withConverter(practiceDataConverter());
      const existsStatus: PracticeStatus[] = [
        "順番待ち",
        "呼出中",
        "移動中",
        "実施中",
      ];

      const incompleteRef = collection
        .where("user_id", "==", booker.id)
        .where("status", "in", existsStatus);
      const incompleteSnapshot = await transaction.get(incompleteRef);

      if (!incompleteSnapshot.empty) {
        console.trace("既に予約が存在します");

        return { errors: "既に予約が存在します" };
      }

      const finishedRef = collection
        .where("user_id", "==", booker.id)
        .where("status", "==", "終了");
      const finishedSnapshot = await transaction.get(finishedRef);
      const reservationCount = finishedSnapshot.size + 1;

      const practice = new PracticeReservation({
        user_id: booker.id,
        user_display_name: booker.display_name,
        reservation_count: reservationCount,
        status: "順番待ち",
        side,
        pit_number: booker.pit_number,
      });

      const reservationRef = collection.doc(practice.id);

      transaction.set(reservationRef, practice);
    });

    if (result?.errors) {
      console.trace(result.errors);

      return result;
    }
  } catch (e: any) {
    console.dir(e);
    console.trace(e.toString());

    return { errors: e.toString() };
  }

  return {};
}

export async function updatePracticeStatus(
  id: string,
  newState: PracticeStatus,
): Promise<ActionResult> {
  const { user } = await validateRequest();

  if (!user || user.role !== "admin") {
    return { errors: "認証情報が不正です．ログインし直してください．" };
  }

  const firestore = await getFirestore();

  try {
    await firestore.runTransaction(async (transaction) => {
      const docRef = firestore
        .collection(PRACTICE_COLLECTION)
        .doc(id)
        .withConverter(practiceDataConverter());

      const doc = await transaction.get(docRef);

      if (!doc.exists) {
        throw new Error("指定された試走場が存在しません");
      }

      const prevState = doc.data()?.status;

      let update: Partial<PracticeReservation> = {
        status: newState,
      };

      if (
        prevState === "順番待ち" &&
        ["呼出中", "移動中", "実施中"].includes(newState)
      ) {
        update.fixed_at = new Date();
      }

      // 順番待ちに戻す時は固定時刻と通知フラグをリセット
      if (
        ["呼出中", "移動中", "実施中"].includes(prevState || "") &&
        newState === "順番待ち"
      ) {
        update.fixed_at = null;
        update.pre_call_sent = false;
        update.call_sent = false;
      }

      // 終了またはキャンセルから他の状態に戻す時は終了時刻をリセット
      if (prevState === "終了" || prevState === "キャンセル") {
        update.finished_at = null;
      }

      if (newState === "終了" || newState === "キャンセル") {
        update.finished_at = new Date();
      }

      transaction.update(docRef, update);
    });
  } catch (e: any) {
    return { errors: e.toString() };
  }

  try {
    Promise.all([
      sendPracticeCall(0, "順番待ち"),
      sendPracticeCall(0, "呼出中"),
      sendPracticeCall(1, "呼出中"),
      sendPracticeCall(2, "呼出中"),
      sendPracticeCall(3, "呼出中"),
    ]);
  } catch (e: any) {
    console.trace(e.toString());
  }

  return {};
}

// 「順番待ち」の先頭からat番目の試走場に呼び出し予告を送信する
async function sendPracticeCall(at: number, status: PracticeStatus) {
  const firestore = await getFirestore();
  const reservationDocs = await firestore
    .collection(PRACTICE_COLLECTION)
    .withConverter(practiceDataConverter())
    .get();
  const reservations = reservationDocs.docs.map((doc) => doc.data());
  const schedule = PracticeSchedule.fromUnsorted(reservations);

  const sidesPromises = PracticeSides.map(async (side) => {
    // 通知対象の試走場を取得
    const waiting = schedule.get(side, status);

    if (waiting.length < at + 1) {
      return;
    }

    const targetId = waiting[at];

    const target = await firestore.runTransaction(async (transaction) => {
      const targetRef = firestore
        .collection(PRACTICE_COLLECTION)
        .doc(targetId)
        .withConverter(practiceDataConverter());

      let target = await transaction.get(targetRef);

      if (status === "順番待ち" && at === 0 && target.data()?.pre_call_sent) {
        return null;
      } else if (status === "呼出中" && target.data()?.call_sent) {
        return null;
      }

      const update: Partial<PracticeReservation> =
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
    let receivers: User[] = [];

    if (status === "呼出中") {
      const admin = await db
        .selectFrom("user")
        .where("role", "=", "admin")
        .selectAll()
        .execute();

      receivers.push(...admin);
    }

    const targetUser = await db
      .selectFrom("user")
      .where("id", "=", target.user_id)
      .selectAll()
      .executeTakeFirst();

    if (targetUser && targetUser.role !== "admin") {
      receivers.push(targetUser);
    }

    // 通知を送信
    const p = receivers.map((receiver) => {
      // 通知内容を作成
      let message = "";

      if (status === "呼出中") {
        // 呼び出し通知
        message = `[${target.user_display_name} ${target.reservation_count}回目 ${target.side}] 試走場の順番になりました．試走場待機エリアに移動してください．`;
      } else if (status === "順番待ち" && at === 0) {
        // 事前通知
        message = `[${target.user_display_name} ${target.reservation_count}回目 ${target.side}] 試走場が近づいています．呼び出された時に移動できるよう準備をお願いします．
他チームの予約状況により順番が前後することもあるため，試走場一覧を確認してください．
https://rotacs-sprc25.yuchi.jp/practice`;
      }

      // 通知を送信
      return sendLineNotifyMessage({ message }, receiver);
    });

    try {
      await Promise.all(p);
    } catch (e: any) {
      console.trace(e.toString());

      // フラグを元に戻す
      const update: Partial<PracticeReservation> =
        at === 1 ? { pre_call_sent: false } : { call_sent: false };

      await firestore
        .collection(PRACTICE_COLLECTION)
        .doc(targetId)
        .withConverter(practiceDataConverter())
        .update(update);
    }
  });

  await Promise.all(sidesPromises);
}
