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

import { reservationDataConverter } from "@/lib/client/reservation";
import { firestore } from "@/lib/firebase/clientApp";
import {
  TESTRUN_COLLECTION,
  TestrunReservation,
  TestrunSchedule,
  TestrunSide,
  TestrunStatus,
} from "@/types/testrun";

export async function getTestrunReservation(
  id: string,
): Promise<TestrunReservation | null> {
  const docRef = doc(firestore, TESTRUN_COLLECTION, id).withConverter(
    testrunDataConverter(),
  );
  const testrun = await getDoc(docRef);

  if (!testrun.exists()) {
    console.info(`ID: ${id} のテストラン予約は存在しません`);

    return null;
  }

  return testrun.data();
}

export async function getTestrunReservations(): Promise<TestrunReservation[]> {
  const q = collection(firestore, TESTRUN_COLLECTION).withConverter(
    testrunDataConverter(),
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => doc.data());
}

export async function getTestrunSchedule(): Promise<TestrunSchedule> {
  const reservations = await getTestrunReservations();

  let schedule = TestrunSchedule.fromUnsorted(reservations);

  return schedule;
}

export async function getTestrunStatus(userDisplayName: string, count: number) {
  const testrunRef = collection(firestore, TESTRUN_COLLECTION).withConverter(
    testrunDataConverter(),
  );
  const q = query(
    testrunRef,
    where("user_display_name", "==", userDisplayName),
    where("reservation_count", "==", count),
  );

  const snapshot = await getDocs(q);

  // sort snapshot
  snapshot.docs.sort((a, b) => {
    return b.data().reserved_at.getTime() - a.data().reserved_at.getTime();
  });

  // console.log(snapshot.docs);

  let latestStatus: TestrunStatus | "未予約" = "未予約";

  snapshot.docs.forEach((doc) => {
    const data = doc.data();

    if (data.status === "終了") {
      latestStatus = "終了";
    } else if (latestStatus !== "終了" && data.status) {
      latestStatus = data.status;
    }
  });

  return latestStatus;
}

export function onTestrunReservationChange(
  id: string,
  callback: (reservation: TestrunReservation | null) => void,
) {
  const docRef = doc(firestore, TESTRUN_COLLECTION, id).withConverter(
    testrunDataConverter(),
  );

  return onSnapshot(docRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);

      return;
    }

    callback(snapshot.data());
  });
}

export function onTestrunCollectionChange(
  callback: (schedule: QuerySnapshot<TestrunReservation, DocumentData>) => void,
) {
  const testrunRef = collection(firestore, TESTRUN_COLLECTION).withConverter(
    testrunDataConverter(),
  );

  return onSnapshot(testrunRef, (snapshot) => {
    callback(snapshot);
  });
}

export function onTestrunChangeByTeam(
  teamName: string,
  testrunNumber: number,
  callback: (status: TestrunStatus | "未予約") => void,
) {
  const testrunRef = collection(firestore, TESTRUN_COLLECTION).withConverter(
    testrunDataConverter(),
  );
  const q = query(
    testrunRef,
    where("user_display_name", "==", teamName),
    where("reservation_count", "==", testrunNumber),
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

export async function updateTestrunStatus(id: string, status: TestrunStatus) {
  try {
    const docRef = doc(firestore, TESTRUN_COLLECTION, id).withConverter(
      testrunDataConverter(),
    );
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      return { ok: false, errors: "対象の予約が見つかりません" };
    }

    const current = snapshot.data();
    const updateData: UpdateData<TestrunReservation> = { status };
    const isInProgress = [
      "呼出中",
      "移動中",
      "スタンバイ中",
      "実施中",
    ].includes(status);
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

    if (
      !["実施中", "終了", "キャンセル"].includes(status) &&
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

export async function updateTestrunRobotCheckEnabled(
  id: string,
  enabled: boolean,
) {
  try {
    const docRef = doc(firestore, TESTRUN_COLLECTION, id).withConverter(
      testrunDataConverter(),
    );

    await updateDoc(docRef, {
      robot_check_enabled: enabled,
    });

    return { ok: true, errors: "" };
  } catch (error: any) {
    return { ok: false, errors: error.message };
  }
}

export async function updateTestrunSide(id: string, side: TestrunSide) {
  try {
    const docRef = doc(firestore, TESTRUN_COLLECTION, id).withConverter(
      testrunDataConverter(),
    );

    await updateDoc(docRef, {
      side,
    });

    return { ok: true, errors: "" };
  } catch (error: any) {
    return { ok: false, errors: error.message };
  }
}

function testrunDataConverter(): FirestoreDataConverter<TestrunReservation> {
  return reservationDataConverter<
    TestrunStatus,
    TestrunSide,
    TestrunReservation
  >();
}
