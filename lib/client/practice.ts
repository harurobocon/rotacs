import {
  collection,
  doc,
  DocumentData,
  FirestoreDataConverter,
  getDoc,
  getDocs,
  onSnapshot,
  QuerySnapshot,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import { reservationDataConverter } from "@/lib/client/reservation";
import { firestore } from "@/lib/firebase/clientApp";
import {
  PRACTICE_COLLECTION,
  PracticeReservation,
  PracticeSchedule,
  PracticeStatus,
  PracticeSide,
} from "@/types/practice";

export async function getPracticeReservation(
  id: string,
): Promise<PracticeReservation | null> {
  const docRef = doc(firestore, PRACTICE_COLLECTION, id).withConverter(
    practiceDataConverter(),
  );
  const practice = await getDoc(docRef);

  if (!practice.exists()) {
    console.info(`ID: ${id} の試走場予約は存在しません`);

    return null;
  }

  return practice.data();
}

export async function getPracticeSchedule(): Promise<PracticeSchedule> {
  const q = collection(firestore, PRACTICE_COLLECTION).withConverter(
    practiceDataConverter(),
  );
  const snapshot = await getDocs(q);
  const reservations = snapshot.docs.map((doc) => doc.data());

  let schedule = PracticeSchedule.fromUnsorted(reservations);

  return schedule;
}

export function onPracticeReservationChange(
  id: string,
  callback: (reservation: PracticeReservation | null) => void,
) {
  const docRef = doc(firestore, PRACTICE_COLLECTION, id).withConverter(
    practiceDataConverter(),
  );

  return onSnapshot(docRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);

      return;
    }

    callback(snapshot.data());
  });
}

export function onPracticeCollectionChange(
  callback: (
    schedule: QuerySnapshot<PracticeReservation, DocumentData>,
  ) => void,
) {
  const practiceRef = collection(firestore, PRACTICE_COLLECTION).withConverter(
    practiceDataConverter(),
  );

  return onSnapshot(practiceRef, (snapshot) => {
    callback(snapshot);
  });
}

export async function updatePracticeStatus(id: string, status: PracticeStatus) {
  try {
    const docRef = doc(firestore, PRACTICE_COLLECTION, id).withConverter(
      practiceDataConverter(),
    );
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      return { ok: false, errors: "対象の予約が見つかりません" };
    }

    const current = snapshot.data();
    const updateData: Record<string, unknown> = { status };
    const isInProgress = ["呼出中", "移動中", "実施中"].includes(status);
    const isFinished = ["終了", "キャンセル"].includes(status);

    if (isInProgress && !current.fixed_at) {
      updateData.fixed_at = serverTimestamp();
    }

    if (status === "順番待ち" && current.fixed_at) {
      updateData.fixed_at = null;
    }

    if (status === "実施中" && !current.started_at) {
      updateData.started_at = serverTimestamp();
    }

    if (isFinished) {
      if (!current.finished_at) {
        updateData.finished_at = serverTimestamp();
      }
    } else if (current.finished_at) {
      updateData.finished_at = null;
    }

    if (!["実施中", "終了", "キャンセル"].includes(status) && current.started_at) {
      updateData.started_at = null;
    }

    await updateDoc(docRef, updateData);

    return { ok: true, errors: "" };
  } catch (error: any) {
    return { ok: false, errors: error.message };
  }
}

function practiceDataConverter(): FirestoreDataConverter<PracticeReservation> {
  return reservationDataConverter<
    PracticeStatus,
    PracticeSide,
    PracticeReservation
  >();
}
