import {
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  Timestamp,
  WithFieldValue,
} from "firebase/firestore";

import { Reservation } from "@/types/reservation";

function toDateOrNull(value: unknown): Date | null {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate: unknown }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate();
  }

  return null;
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
      data.reserved_at = toDateOrNull(data.reserved_at) ?? new Date(0);
      data.fixed_at = toDateOrNull(data.fixed_at);
      data.started_at = toDateOrNull(data.started_at);
      data.finished_at = toDateOrNull(data.finished_at);

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
    started_at: reservation.started_at
      ? Timestamp.fromDate(reservation.started_at)
      : null,
    finished_at: reservation.finished_at
      ? Timestamp.fromDate(reservation.finished_at)
      : null,
  };
}
