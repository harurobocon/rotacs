import { Reservation, Schedule } from "@/types/reservation";

export const PRACTICE_COLLECTION =
  process.env.NEXT_PUBLIC_PRACTICE_RESERVATION_COLLECTION ||
  "practice_reservations";

export const PracticeStatuses = [
  "終了",
  "実施中",
  "移動中",
  "呼出中",
  "順番待ち",
  "キャンセル",
] as const;
export type PracticeStatus = (typeof PracticeStatuses)[number];

export type PracticeSide = "default";

export const PracticeSides: PracticeSide[] = ["default"];

export class PracticeReservation extends Reservation<
  PracticeStatus,
  PracticeSide
> {
  constructor(
    options: Partial<PracticeReservation> & {
      user_id: string;
      user_display_name: string;
      reservation_count: number;
      status: PracticeStatus;
      side: PracticeSide;
    },
  ) {
    super(options);
  }
}

export class PracticeSchedule extends Schedule<PracticeStatus, PracticeSide> {
  constructor(initial?: PracticeSchedule) {
    super(initial);
  }

  static fromUnsorted(reservations: PracticeReservation[]) {
    const schedule = new PracticeSchedule();

    if (reservations.length === 0) {
      console.info("まだ試走場予約がありません");

      return schedule;
    }

    PracticeStatuses.forEach((status) => {
      const filtered = reservations.filter((reservation) => {
        return reservation.status === status;
      });

      let sorted, ids;

      switch (status) {
        case "終了":
        case "キャンセル":
          sorted = filtered.sort((a, b) => {
            const aFinishedAt = a.finished_at;
            const bFinishedAt = b.finished_at;

            if (aFinishedAt === null || bFinishedAt === null) {
              return 0;
            }

            return aFinishedAt > bFinishedAt ? 1 : -1;
          });
          ids = sorted.map((r) => r.id);
          schedule.set("default", status, ids);
          break;
        case "呼出中":
        case "移動中":
        case "実施中":
          sorted = filtered.sort((a, b) => {
            const aFixedAt = a.fixed_at;
            const bFixedAt = b.fixed_at;

            if (aFixedAt === null || bFixedAt === null) {
              return 0;
            }

            return aFixedAt > bFixedAt ? 1 : -1;
          });
          ids = sorted.map((r) => r.id);
          schedule.set("default", status, ids);
          break;
        default:
          sorted = filtered.sort((a, b) => {
            const aCount = a.reservation_count;
            const bCount = b.reservation_count;

            if (aCount === bCount) {
              const aReservedAt = a.reserved_at;
              const bReservedAt = b.reserved_at;

              return aReservedAt > bReservedAt ? 1 : -1;
            }

            return aCount > bCount ? 1 : -1;
          });
          ids = sorted.map((r) => r.id);
          schedule.set("default", status, ids);
          break;
      }
    });

    return schedule;
  }
}
