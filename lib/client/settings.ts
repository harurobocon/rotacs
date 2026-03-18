"use client";

import { doc, onSnapshot, getDoc } from "firebase/firestore";

import { dataConverter } from "@/lib/firebase/firestore";
import { firestore } from "@/lib/firebase/clientApp";
import {
  RESERVATION_SETTINGS_COLLECTION,
  RESERVATION_SETTINGS_DOCUMENT_ID,
  RESERVATION_TYPES,
  ReservationSettings,
  DEFAULT_RESERVATION_CONDITIONS,
  DEFAULT_RESERVATION_GLOBAL_SETTINGS,
  ReservationConditionFallbackMap,
  resolveConditionEnabled,
  resolveAdminBypassEnabled,
  CHECK_LOCATION_SETTINGS_COLLECTION,
  CHECK_LOCATION_SETTINGS_DOCUMENT_ID,
  CheckLocationSettings,
  CHECK_ITEMS_SETTINGS_COLLECTION,
  CHECK_ITEMS_SETTINGS_DOCUMENT_ID,
  CheckItemsSettings,
  CheckItemSetting,
  CHECK_ITEM_TYPES,
  DEFAULT_CHECK_ITEM_SETTINGS,
} from "@/types/settings";

const defaultSettings: ReservationSettings = RESERVATION_TYPES.reduce(
  (acc, type) => {
    acc[type] = {
      mode: "disabled",
      startDate: "2000-01-01",
      startTime: "09:00",
      conditions: {
        ...DEFAULT_RESERVATION_CONDITIONS,
      },
    };

    return acc;
  },
  {
    global: { ...DEFAULT_RESERVATION_GLOBAL_SETTINGS },
  } as ReservationSettings,
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
      callback(
        normalizeReservationSettingsWithFallbackInfo(doc.data()).settings,
      );
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
    return normalizeReservationSettingsWithFallbackInfo(docSnap.data()).settings;
  } else {
    return defaultSettings;
  }
}

export async function getReservationSettingsWithFallbackInfo(): Promise<{
  settings: ReservationSettings;
  fallbackMap: ReservationConditionFallbackMap;
  globalFallback: boolean;
}> {
  const settingsRef = doc(
    firestore,
    RESERVATION_SETTINGS_COLLECTION,
    RESERVATION_SETTINGS_DOCUMENT_ID,
  ).withConverter(dataConverter<ReservationSettings>());

  const docSnap = await getDoc(settingsRef);

  if (docSnap.exists()) {
    return normalizeReservationSettingsWithFallbackInfo(docSnap.data());
  }

  return {
    settings: defaultSettings,
    fallbackMap: createDefaultFallbackMap(),
    globalFallback: true,
  };
}

function createDefaultFallbackMap(): ReservationConditionFallbackMap {
  return RESERVATION_TYPES.reduce((acc, type) => {
    acc[type] = {
      preventDuplicateReservation: true,
      requireCheck1Pass: type !== "check1",
    };

    return acc;
  }, {} as ReservationConditionFallbackMap);
}

function normalizeReservationSettingsWithFallbackInfo(
  settings: ReservationSettings,
): {
  settings: ReservationSettings;
  fallbackMap: ReservationConditionFallbackMap;
  globalFallback: boolean;
} {
  const fallbackMap = createDefaultFallbackMap();
  const globalFallback =
    settings?.global?.adminBypassEnabled === null ||
    settings?.global?.adminBypassEnabled === undefined;

  const normalized = RESERVATION_TYPES.reduce((acc, type) => {
    const current = settings[type];
    const rawConditions = (current?.conditions ?? {}) as Partial<
      Record<"preventDuplicateReservation" | "requireCheck1Pass", boolean | null>
    >;

    const preventDuplicateFallback =
      rawConditions.preventDuplicateReservation === null ||
      rawConditions.preventDuplicateReservation === undefined;
    const requireCheck1PassFallback =
      rawConditions.requireCheck1Pass === null ||
      rawConditions.requireCheck1Pass === undefined;

    fallbackMap[type] = {
      preventDuplicateReservation: preventDuplicateFallback,
      requireCheck1Pass: requireCheck1PassFallback,
    };

    acc[type] = {
      mode: current?.mode ?? "disabled",
      startDate: current?.startDate ?? "2000-01-01",
      startTime: current?.startTime ?? "09:00",
      conditions: {
        preventDuplicateReservation: resolveConditionEnabled(
          "preventDuplicateReservation",
          preventDuplicateFallback
            ? undefined
            : rawConditions.preventDuplicateReservation,
        ),
        ...(type === "check1"
          ? {}
          : {
              requireCheck1Pass: resolveConditionEnabled(
                "requireCheck1Pass",
                requireCheck1PassFallback
                  ? undefined
                  : rawConditions.requireCheck1Pass,
              ),
            }),
      },
    };

    return acc;
  }, {
    global: {
      adminBypassEnabled: resolveAdminBypassEnabled(
        globalFallback ? undefined : settings.global.adminBypassEnabled,
      ),
    },
  } as ReservationSettings);

  return {
    settings: normalized,
    fallbackMap,
    globalFallback,
  };
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

function normalizeCheckItems(checkTypeItems: CheckItemSetting[]): CheckItemSetting[] {
  return checkTypeItems
    .filter(
      (item) =>
        typeof item?.id === "string" &&
        item.id.length > 0 &&
        typeof item?.label === "string" &&
        CHECK_ITEM_TYPES.includes(item.type),
    )
    .map((item, index) => ({
      id: item.id,
      label: item.label,
      type: item.type,
      order: Number.isFinite(item.order) ? item.order : index,
      enabled: item.enabled !== false,
    }))
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}

function normalizeCheckItemsSettings(
  raw: Partial<CheckItemsSettings> | null | undefined,
): CheckItemsSettings {
  const check1 = normalizeCheckItems(raw?.check1 ?? DEFAULT_CHECK_ITEM_SETTINGS.check1);
  const check2 = normalizeCheckItems(raw?.check2 ?? DEFAULT_CHECK_ITEM_SETTINGS.check2);

  return {
    check1: check1.length > 0 ? check1 : DEFAULT_CHECK_ITEM_SETTINGS.check1,
    check2: check2.length > 0 ? check2 : DEFAULT_CHECK_ITEM_SETTINGS.check2,
  };
}

export async function getCheckItemsSettings(): Promise<CheckItemsSettings> {
  const settingsRef = doc(
    firestore,
    CHECK_ITEMS_SETTINGS_COLLECTION,
    CHECK_ITEMS_SETTINGS_DOCUMENT_ID,
  ).withConverter(dataConverter<CheckItemsSettings>());

  const docSnap = await getDoc(settingsRef);

  if (!docSnap.exists()) {
    return DEFAULT_CHECK_ITEM_SETTINGS;
  }

  return normalizeCheckItemsSettings(docSnap.data());
}

export function listenCheckItemsSettings(
  callback: (settings: CheckItemsSettings) => void,
): () => void {
  const settingsRef = doc(
    firestore,
    CHECK_ITEMS_SETTINGS_COLLECTION,
    CHECK_ITEMS_SETTINGS_DOCUMENT_ID,
  ).withConverter(dataConverter<CheckItemsSettings>());

  return onSnapshot(settingsRef, (doc) => {
    if (doc.exists()) {
      callback(normalizeCheckItemsSettings(doc.data()));
    } else {
      callback(DEFAULT_CHECK_ITEM_SETTINGS);
    }
  });
}
