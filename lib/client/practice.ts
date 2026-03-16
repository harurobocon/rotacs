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
    const updateData: any = { status };

    if (status === "呼出中") {
      updateData.fixed_at = serverTimestamp();
    } else if (
      status === "実施中" ||
      status === "終了" ||
      status === "キャンセル"
    ) {
      updateData.finished_at = serverTimestamp();
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
