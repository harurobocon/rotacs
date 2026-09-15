import {
  collection,
  doc,
  DocumentData,
  FirestoreDataConverter,
  UpdateData,
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
  onError?: (error: Error) => void,
) {
  const docRef = doc(firestore, collectionId, id).withConverter(
    checkDataConverter(),
  );

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);

        return;
      }

      callback(snapshot.data());
    },
    (error) => {
      console.error("[Firestore] onCheckReservationChange error:", error);
      onError?.(error);
    },
  );
}

export function onCheckCollectionChange(
  collectionId: string,
  callback: (schedule: QuerySnapshot<CheckReservation, DocumentData>) => void,
  onError?: (error: Error) => void,
) {
  const checkRef = collection(firestore, collectionId).withConverter(
    checkDataConverter(),
  );

  return onSnapshot(
    checkRef,
    (snapshot) => {
      callback(snapshot);
    },
    (error) => {
      console.error("[Firestore] onCheckCollectionChange error:", error);
      onError?.(error);
    },
  );
}

export function onCheckChangeByTeam(
  collectionId: string,
  teamName: string,
  callback: (status: CheckStatus | "未予約") => void,
  onError?: (error: Error) => void,
) {
  const checkRef = collection(firestore, collectionId).withConverter(
    checkDataConverter(),
  );
  const q = query(
    checkRef,
    where("user_display_name", "==", teamName),
    orderBy("reserved_at", "desc"),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        callback("未予約");
      } else {
        callback(snapshot.docs[0].data().status);
      }
    },
    (error) => {
      console.error("[Firestore] onCheckChangeByTeam error:", error);
      onError?.(error);
    },
  );
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
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      return { ok: false, errors: "対象の予約が見つかりません" };
    }

    const current = snapshot.data();
    const updateData: UpdateData<CheckReservation> = { status };
    const isInProgress = ["呼出中", "移動中", "実施中"].includes(status);
    const isFinished = ["合格", "再検査", "キャンセル"].includes(status);

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

    if (
      !["実施中", "合格", "再検査", "キャンセル"].includes(status) &&
      current.started_at
    ) {
      updateData.started_at = null;
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
  results: Record<string, boolean | string | number>,
) {
  try {
    const docRef = doc(firestore, collectionId, id).withConverter(
      checkDataConverter(),
    );

    await updateDoc(docRef, {
      status,
      ...results,
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
