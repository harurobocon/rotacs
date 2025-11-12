"use client";

import { doc, onSnapshot, getDoc } from "firebase/firestore";

import { dataConverter } from "@/lib/firebase/firestore";
import { firestore } from "@/lib/firebase/clientApp";
import {
  RESERVATION_SETTINGS_COLLECTION,
  RESERVATION_SETTINGS_DOCUMENT_ID,
  RESERVATION_TYPES,
  ReservationSettings,
  CHECK_LOCATION_SETTINGS_COLLECTION,
  CHECK_LOCATION_SETTINGS_DOCUMENT_ID,
  CheckLocationSettings,
} from "@/types/settings";

const defaultSettings: ReservationSettings = RESERVATION_TYPES.reduce(
  (acc, type) => {
    acc[type] = {
      mode: "disabled",
      startDate: "2000-01-01",
      startTime: "09:00",
    };
    return acc;
  },
  {} as ReservationSettings,
);

export function listenReservationSettings(
  callback: (settings: ReservationSettings) => void,
): () => void {
  const settingsRef = doc(
    firestore,
    RESERVATION_SETTINGS_COLLECTION,
    RESERVATION_SETTINGS_DOCUMENT_ID,
  ).withConverter(dataConverter<ReservationSettings>());

  const unsubscribe = onSnapshot(settingsRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data());
    } else {
      callback(defaultSettings);
    }
  });

  return unsubscribe;
}

export async function getReservationSettings(): Promise<ReservationSettings> {
  const settingsRef = doc(
    firestore,
    RESERVATION_SETTINGS_COLLECTION,
    RESERVATION_SETTINGS_DOCUMENT_ID,
  ).withConverter(dataConverter<ReservationSettings>());

  const docSnap = await getDoc(settingsRef);

  if (docSnap.exists()) {
    return docSnap.data();
  } else {
    return defaultSettings;
  }
}

// 計量計測モード設定
const defaultCheckLocationSettings: CheckLocationSettings = {
  check1: "single",
  check2: "single",
};

export async function getCheckLocationSettings(): Promise<CheckLocationSettings> {
  const settingsRef = doc(
    firestore,
    CHECK_LOCATION_SETTINGS_COLLECTION,
    CHECK_LOCATION_SETTINGS_DOCUMENT_ID,
  ).withConverter(dataConverter<CheckLocationSettings>());

  const docSnap = await getDoc(settingsRef);

  if (docSnap.exists()) {
    return docSnap.data();
  } else {
    return defaultCheckLocationSettings;
  }
}

export function listenCheckLocationSettings(
  callback: (settings: CheckLocationSettings) => void,
): () => void {
  const settingsRef = doc(
    firestore,
    CHECK_LOCATION_SETTINGS_COLLECTION,
    CHECK_LOCATION_SETTINGS_DOCUMENT_ID,
  ).withConverter(dataConverter<CheckLocationSettings>());

  const unsubscribe = onSnapshot(settingsRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data());
    } else {
      callback(defaultCheckLocationSettings);
    }
  });

  return unsubscribe;
}
