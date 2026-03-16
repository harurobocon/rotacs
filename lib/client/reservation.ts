import {
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  Timestamp,
  WithFieldValue,
} from "firebase/firestore";

import { Reservation } from "@/types/reservation";

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
