"use server";

import "server-cli-only";

import { FirestoreDataConverter } from "firebase-admin/firestore";
import { User } from "lucia";

import {
  CheckReservation,
  CheckSide,
  CheckStatus,
  CheckSchedule,
  CheckSides,
} from "@/types/check";
import { ActionResult } from "@/types/actions";
import { getFirestore } from "@/lib/firebase/serverApp";
import { validateRequest } from "@/lib/server/auth";
import {
  reservationDataConverter,
  validateFormData as _validateFormData,
} from "@/lib/server/reservation";
import { checkDataConverter } from "@/lib/server/converters";
import { db } from "@/lib/server/db";
import { sendLineNotifyMessage } from "@/lib/server/line-notify";

async function validateFormData(formData: FormData, currentUser: User) {
  let { booker, collectionId } = await _validateFormData<CheckSide>(
    formData,
    currentUser,
  );

  if (!collectionId) {
    throw Error("計量計測の種類が指定されていません");
  }

  return { booker, collectionId };
}

export async function createCheck(
  state: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { user: currentUser } = await validateRequest();

  if (!currentUser) {
    console.trace("認証情報が不正です．ログインし直してください．");

    return { errors: "認証情報が不正です．ログインしなおしてください" };
  }

  let booker: User;
  let collectionId: string;

  try {
    ({ booker, collectionId } = await validateFormData(formData, currentUser));
  } catch (e: any) {
    return { errors: e.toString() };
  }

  try {
    const firestore = await getFirestore();
    const retryCount = 0;

    const result = await firestore.runTransaction(async (transaction) => {
      if (retryCount > 0) {
        console.log(
          `[${booker.display_name}] createCheck retry: ${retryCount}`,
        );
      }

      const collection = firestore
        .collection(collectionId)
        .withConverter(checkDataConverter());
      const existsStatus: CheckStatus[] = [
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
        .where("status", "in", ["合格", "再検査"]);
      const finishedSnapshot = await transaction.get(finishedRef);
      const reservationCount = finishedSnapshot.size + 1;

      const check = new CheckReservation({
        user_id: booker.id,
        user_display_name: booker.display_name,
        reservation_count: reservationCount,
        status: "順番待ち",
        side: booker.pit_side,
        pit_number: booker.pit_number,
      });

      const reservationRef = collection.doc(check.id);

      transaction.set(reservationRef, check);
    });

    if (result?.errors) {
      return result;
    }
  } catch (e: any) {
    console.dir(e);
    console.trace(e);

    return { errors: e.toString() };
  }

  return {};
}

export async function updateCheckStatus(
  id: string,
  newState: CheckStatus,
  collectionId: string,
): Promise<ActionResult> {
  const { user } = await validateRequest();

  if (!user || user.role !== "admin") {
    return { errors: "認証情報が不正です．ログインし直してください．" };
  }

  const firestore = await getFirestore();

  try {
    await firestore.runTransaction(async (transaction) => {
      const docRef = firestore
        .collection(collectionId)
        .doc(id)
        .withConverter(checkDataConverter());

      const doc = await transaction.get(docRef);

      if (!doc.exists) {
        return { errors: "指定された計量計測が存在しません" };
      }

      const prevState = doc.data()?.status;

      let update: Partial<CheckReservation> = {
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
      if (
        ["合格", "再検査", "キャンセル"].includes(prevState || "") &&
        !["合格", "再検査", "キャンセル"].includes(newState)
      ) {
        update.finished_at = null;
      }

      if (["合格", "再検査", "キャンセル"].includes(newState)) {
        update.finished_at = new Date();
      }

      transaction.update(docRef, update);
    });
  } catch (e: any) {
    console.dir(e);
    console.trace(e);

    return { errors: e.toString() };
  }

  try {
    Promise.all([
      sendCall(0, "順番待ち", collectionId),
      sendCall(0, "呼出中", collectionId),
      sendCall(1, "呼出中", collectionId),
      sendCall(2, "呼出中", collectionId),
      sendCall(3, "呼出中", collectionId),
    ]);
  } catch (e: any) {
    console.trace(e.toString());
  }

  return {};
}

export async function updateCheckResults(
  state: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { user } = await validateRequest();

  if (!user || user.role !== "admin") {
    return { errors: "認証情報が不正です．ログインし直してください．" };
  }

  const id = formData.get("id")!.toString();
  const collectionId = formData.get("collectionId")!.toString();

  const update: Partial<CheckReservation> = {
    status: formData.get("status")?.toString() as CheckStatus,
    startSize: formData.has("startSize"),
    r1ExpandSize: formData.has("r1ExpandSize"),
    totalWeight: formData.has("totalWeight"),
    powerVoltage: formData.has("powerVoltage"),
    emergencyStop: formData.has("emergencyStop"),
    memo: formData.get("memo")?.toString() ?? "",
    recheckItems: formData.get("recheckItems")?.toString() ?? "",
  };

  const firestore = await getFirestore();

  await firestore.collection(collectionId).doc(id).update(update);

  return {};
}

async function sendCall(at: number, status: CheckStatus, collectionId: string) {
  const firestore = await getFirestore();
  const reservationDocs = await firestore
    .collection(collectionId)
    .withConverter(checkDataConverter())
    .get();
  const reservations = reservationDocs.docs.map((doc) => doc.data());
  const schedule = CheckSchedule.fromUnsorted(reservations);

  const sidesPromises = CheckSides.map(async (side) => {
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

    let receivers: User[] = [];

    if (status === "呼出中") {
      // 呼出中時のみ管理者にも通知
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
        message = `[${target.user_display_name} ${target.reservation_count}回目 ${target.side}] 計量計測の順番になりました．「${target.side}」計量計測エリアに移動してください．`;
      } else if (status === "順番待ち" && at === 0) {
        // 事前通知
        message = `[${target.user_display_name} ${target.reservation_count}回目 ${target.side}] 計量計測が近づいています．呼び出された時に移動できるよう準備をお願いします．
他チームの予約状況により順番が前後することもあるため，順番表を確認してください．
https://rotacs-sprc25.yuchi.jp/check1`;
      }

      // 通知を送信
      return sendLineNotifyMessage({ message }, receiver);
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
