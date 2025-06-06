import {
  collection,
  doc,
  DocumentData,
  FirestoreDataConverter,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  QuerySnapshot,
  where,
} from "firebase/firestore";

import {
  CheckReservation,
  CheckSchedule,
  CheckSide,
  CheckStatus,
} from "@/types/check";
import { firestore } from "@/lib/firebase/clientApp";
import { reservationDataConverter } from "@/lib/client/reservation";

export async function getCheckReservation(
  id: string,
  collectionId: string,
): Promise<CheckReservation | null> {
  const docRef = doc(firestore, collectionId, id).withConverter(
    checkDataConverter(),
  );
  const check = await getDoc(docRef);

  if (!check.exists()) {
    console.info(`ID: ${id} の計量計測予約は存在しません`);

    return null;
  }

  return check.data();
}

export async function getCheckSchedule(
  collectionId: string,
): Promise<CheckSchedule> {
  const q = collection(firestore, collectionId).withConverter(
    checkDataConverter(),
  );
  const snapshot = await getDocs(q);
  const reservations = snapshot.docs.map((doc) => doc.data());

  let schedule = CheckSchedule.fromUnsorted(reservations);

  return schedule;
}

export async function getCheckStatus(
  userDisplayName: string,
  collectionId: string,
) {
  const collectionRef = collection(firestore, collectionId).withConverter(
    checkDataConverter(),
  );
  const q = query(
    collectionRef,
    where("user_display_name", "==", userDisplayName),
  );

  let snapshot = await getDocs(q);

  // sort snapshot
  snapshot.docs.sort((a, b) => {
    return b.data().reserved_at.getTime() - a.data().reserved_at.getTime();
  });

  let latestStatus: CheckStatus | "未予約" = "未予約";

  snapshot.docs.forEach((doc) => {
    const check = doc.data();

    if (check.status === "合格") {
      latestStatus = "合格";
    } else if (latestStatus !== "合格" && check.status === "再検査") {
      latestStatus = "再検査";
    } else if (
      !["合格", "再検査"].includes(latestStatus) &&
      ["順番待ち", "呼出中", "移動中", "実施中"].includes(check.status)
    ) {
      latestStatus = check.status;
    }
  });

  return latestStatus;
}

export function onCheckReservationChange(
  id: string,
  collectionId: string,
  callback: (reservation: CheckReservation | null) => void,
) {
  const docRef = doc(firestore, collectionId, id).withConverter(
    checkDataConverter(),
  );

  return onSnapshot(docRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);

      return;
    }

    callback(snapshot.data());
  });
}

export function onCheckCollectionChange(
  collectionId: string,
  callback: (schedule: QuerySnapshot<CheckReservation, DocumentData>) => void,
) {
  const checkRef = collection(firestore, collectionId).withConverter(
    checkDataConverter(),
  );

  return onSnapshot(checkRef, (snapshot) => {
    callback(snapshot);
  });
}

function checkDataConverter(): FirestoreDataConverter<CheckReservation> {
  return reservationDataConverter<CheckStatus, CheckSide, CheckReservation>();
}
