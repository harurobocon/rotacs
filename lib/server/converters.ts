import { FirestoreDataConverter } from "firebase-admin/firestore";

import { reservationDataConverter } from "./reservation";

import {
  PracticeReservation,
  PracticeStatus,
  PracticeSide,
} from "@/types/practice";
import {
  TestrunReservation,
  TestrunStatus,
  TestrunSide,
} from "@/types/testrun";
import { CheckReservation, CheckStatus, CheckSide } from "@/types/check";

export function practiceDataConverter(): FirestoreDataConverter<PracticeReservation> {
  return reservationDataConverter<
    PracticeStatus,
    PracticeSide,
    PracticeReservation
  >();
}

export function testrunDataConverter(): FirestoreDataConverter<TestrunReservation> {
  return reservationDataConverter<
    TestrunStatus,
    TestrunSide,
    TestrunReservation
  >();
}

export function checkDataConverter(): FirestoreDataConverter<CheckReservation> {
  return reservationDataConverter<CheckStatus, CheckSide, CheckReservation>();
}
