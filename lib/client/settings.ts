"use client";

import { doc, onSnapshot, getDoc } from "firebase/firestore";

import { dataConverter } from "@/lib/firebase/firestore";
import { firestore } from "@/lib/firebase/clientApp";
import {
  RESERVATION_SETTINGS_COLLECTION,
  RESERVATION_SETTINGS_DOCUMENT_ID,
  RESERVATION_TYPES,
  ReservationSettings,
} from "@/types/settings";

const defaultSettings: ReservationSettings = RESERVATION_TYPES.reduce(
  (acc, type) => {
    acc[type] = { mode: "disabled", startTime: "09:00" };
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
