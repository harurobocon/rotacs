"use server";

import "server-cli-only";

import { User } from "lucia";

import { sendSlackNotifyMessage } from "./slack";

import {
  CheckReservation,
  CheckSide,
  CheckStatus,
  CheckSchedule,
  getCheckSides,
} from "@/types/check";
import { ActionResult } from "@/types/actions";
import { getFirestore } from "@/lib/firebase/serverApp";
import { validateRequest } from "@/lib/server/auth";
import { validateFormData as _validateFormData } from "@/lib/server/reservation";
import { checkDataConverter } from "@/lib/server/converters";
import { db } from "@/lib/server/db";
import { getCheckLocationSettings } from "@/lib/server/settings";
import { CHECK1_COLLECTION, CHECK2_COLLECTION } from "@/types/check";

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
    let shouldNotifyNewReservation = false;

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

      // 予約作成前のアクティブな予約数をチェック（今後実施が予定されている予約）
      const activeRef = collection.where("status", "in", existsStatus);
      const activeSnapshot = await transaction.get(activeRef);
      const currentActiveCount = activeSnapshot.size;

      const finishedRef = collection
        .where("user_id", "==", booker.id)
        .where("status", "in", ["合格", "再検査"]);
      const finishedSnapshot = await transaction.get(finishedRef);
      const reservationCount = finishedSnapshot.size + 1;

      // 計量計測モード設定を取得してsideを決定
      const checkSettings = await getCheckLocationSettings();
      const checkType =
        collectionId === CHECK1_COLLECTION ? "check1" : "check2";
      const mode = checkSettings[checkType];

      let side: CheckSide;
      if (mode === "dual") {
        // 2箇所モード: ユーザーのpit_sideを使用（西/東）
        side = booker.pit_side as CheckSide;
      } else {
        // 1箇所モード: "ピット"を使用
        side = "ピット";
      }

      const check = new CheckReservation({
        user_id: booker.id,
        user_display_name: booker.display_name,
        reservation_count: reservationCount,
        status: "順番待ち",
        side: side,
        pit_number: booker.pit_number,
      });

      const reservationRef = collection.doc(check.id);

      transaction.set(reservationRef, check);

      // アクティブな予約が空だった場合（現在の予約が最初の1件）の場合に通知フラグを設定
      if (currentActiveCount === 0) {
        shouldNotifyNewReservation = true;
      }
    });

    if (result?.errors) {
      return result;
    }

    // アクティブな予約が空だった場合に管理者に通知
    if (shouldNotifyNewReservation) {
      try {
        await sendNewReservationNotification(booker, collectionId);
      } catch (e: any) {
        console.trace(`通知送信エラー: ${e.toString()}`);
      }
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
    await Promise.all([
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
    size: formData.has("size"),
    weight: formData.has("weight"),
    emergencyStop: formData.has("emergencyStop"),
    led: formData.has("led"),
    power: formData.has("power"),
    compressedAir: formData.has("compressedAir"),
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
    const checkSettings = await getCheckLocationSettings();
    const checkType = collectionId === CHECK1_COLLECTION ? "check1" : "check2";
    const mode = checkSettings[checkType];

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

    const targetUser = await db
      .selectFrom("user")
      .where("id", "=", target.user_id)
      .selectAll()
      .executeTakeFirst();

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

async function sendNewReservationNotification(
  booker: User,
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

export async function createCheckMessageCard(
  state: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { user: currentUser } = await validateRequest();

  if (!currentUser) {
    console.trace("認証情報が不正です．ログインし直してください．");
    return { errors: "認証情報が不正です．ログインしなおしてください" };
  }

  let message: string;
  let collectionId: string;

  try {
    message = formData.get("message")?.toString() ?? "";
    collectionId = formData.get("collectionId")?.toString() ?? "";
    if (!collectionId) {
      throw new Error("計量計測の種類が指定されていません");
    }
  } catch (e: any) {
    return { errors: e.toString() };
  }

  try {
    const firestore = await getFirestore();
    const retryCount = 0;

    await firestore.runTransaction(async (transaction) => {
      if (retryCount > 0) {
        console.log(
          `[${currentUser.display_name}] createCheckMessageCard retry: ${retryCount}`,
        );
      }

      const collection = firestore
        .collection(collectionId)
        .withConverter(checkDataConverter());

      const check = new CheckReservation({
        user_id: currentUser.id,
        user_display_name: message,
        reservation_count: 0,
        status: "順番待ち",
        side: "ピット",
        pit_number: 0,
      });

      const reservationRef = collection.doc(check.id);
      transaction.set(reservationRef, check);
    });
  } catch (e: any) {
    console.dir(e);
    console.trace(e.toString());
    return { errors: e.toString() };
  }

  return {};
}
