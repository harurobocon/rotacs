import "server-cli-only";

import {
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  Timestamp,
  WithFieldValue,
} from "firebase-admin/firestore";

import { Reservation } from "@/types/reservation";
import { FirestoreUser } from "@/types/user";
import { getFirestoreUserById } from "@/lib/server/firestoreUserHelpers";

export async function validateFormData<SideType extends string>(
  formData: FormData,
  currentUserId: string,
  isAdmin: boolean,
): Promise<{
  side: SideType | undefined;
  booker: FirestoreUser;
  collectionId: string | undefined;
}> {
  // formDataの検証
  const sideValue = formData.get("side");

  let side: SideType | undefined = undefined;

  if (sideValue) {
    side = sideValue.toString() as SideType;
  }

  let bookerId: string | undefined = undefined;

  if (formData.has("bookerId")) {
    bookerId = formData.get("bookerId")?.toString();
  }

  let collectionId: string | undefined = undefined;

  if (formData.has("collectionId")) {
    collectionId = formData.get("collectionId")?.toString();
  }

  // Get current user from Firestore
  const currentUser = await getFirestoreUserById(currentUserId);

  if (!currentUser) {
    throw Error("ユーザー情報が見つかりません");
  }

  // Adminは他のユーザの予約を作成できる
  // 指定されたユーザーの予約を作成する権限があるかを検証
  let booker: FirestoreUser = currentUser;

  if (isAdmin) {
    if (bookerId) {
      const _booker = await getFirestoreUserById(bookerId);

      if (!_booker) {
        console.trace("指定されたユーザが存在しません");

        throw Error("指定されたユーザが存在しません");
      }

      booker = _booker;
    }
  } else {
    if (bookerId && bookerId !== currentUserId) {
      console.trace("他のユーザの予約を作成することはできません");

      throw Error("他のユーザの予約を作成することはできません");
    }
  }

  return { side, booker, collectionId };
}

export function reservationDataConverter<
  StatusType extends string,
  SideType extends string,
  ReservationType extends Reservation<StatusType, SideType>,
>(): FirestoreDataConverter<ReservationType> {
  return {
    toFirestore: (data: WithFieldValue<ReservationType>) => {
      return objectifyReservation(data as ReservationType);
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot<ReservationType>) => {
      const data = snapshot.data() as any;

      data.id = snapshot.id;
      data.reserved_at = data.reserved_at.toDate();
      data.fixed_at = data.fixed_at ? data.fixed_at.toDate() : null;
      data.finished_at = data.finished_at ? data.finished_at.toDate() : null;

      return data as ReservationType;
    },
  };
}

export function objectifyReservation<
  StatusType extends string,
  SideType extends string,
>(reservation: Reservation<StatusType, SideType>) {
  return {
    ...reservation,
    reserved_at: Timestamp.fromDate(reservation.reserved_at),
    fixed_at: reservation.fixed_at
      ? Timestamp.fromDate(reservation.fixed_at)
      : null,
    finished_at: reservation.finished_at
      ? Timestamp.fromDate(reservation.finished_at)
      : null,
  };
}
