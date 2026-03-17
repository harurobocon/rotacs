import {
  collection,
  doc,
  DocumentData,
  FirestoreDataConverter,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  QuerySnapshot,
  where,
  updateDoc,
  serverTimestamp,
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
  mode: "single" | "dual",
): Promise<CheckSchedule> {
  const q = collection(firestore, collectionId).withConverter(
    checkDataConverter(),
  );
  const snapshot = await getDocs(q);
  const reservations = snapshot.docs.map((doc) => doc.data());

  let schedule = CheckSchedule.fromUnsorted(reservations, mode);

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

export function onCheckChangeByTeam(
  collectionId: string,
  teamName: string,
  callback: (status: CheckStatus | "未予約") => void,
) {
  const checkRef = collection(firestore, collectionId).withConverter(
    checkDataConverter(),
  );
  const q = query(
    checkRef,
    where("user_display_name", "==", teamName),
    orderBy("reserved_at", "desc"),
  );

  return onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      callback("未予約");
    } else {
      callback(snapshot.docs[0].data().status);
    }
  });
}

export async function updateCheckStatus(
  id: string,
  status: CheckStatus,
  collectionId: string,
) {
  try {
    const docRef = doc(firestore, collectionId, id).withConverter(
      checkDataConverter(),
    );
    const updateData: any = { status };

    if (status === "呼出中") {
      updateData.fixed_at = serverTimestamp();
    } else if (
      status === "実施中" ||
      status === "合格" ||
      status === "再検査" ||
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

export async function updateCheckResults(
  id: string,
  collectionId: string,
  status: CheckStatus,
  initialSizeLimit: boolean,
  deployedSizeLimit: boolean,
  weight: boolean,
  safetyCheck: boolean,
  emergencyStop: boolean,
  led: boolean,
  power: boolean,
  compressedAir: boolean,
  memo: string,
  recheckItems: string,
) {
  try {
    const docRef = doc(firestore, collectionId, id).withConverter(
      checkDataConverter(),
    );

    await updateDoc(docRef, {
      status,
      initialSizeLimit,
      deployedSizeLimit,
      weight,
      safetyCheck,
      emergencyStop,
      led,
      power,
      compressedAir,
      memo,
      recheckItems,
      finished_at: serverTimestamp(),
    });

    return { ok: true, errors: "" };
  } catch (error: any) {
    return { ok: false, errors: error.message };
  }
}

function checkDataConverter(): FirestoreDataConverter<CheckReservation> {
  return reservationDataConverter<CheckStatus, CheckSide, CheckReservation>();
}
