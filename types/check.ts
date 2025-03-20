import { Reservation, Schedule } from "@/types/reservation";

export const CHECK1_COLLECTION =
  process.env.NEXT_PUBLIC_CHECK1_RESERVATION_COLLECTION ||
  "check1_reservations";
export const CHECK2_COLLECTION =
  process.env.NEXT_PUBLIC_CHECK2_RESERVATION_COLLECTION ||
  "check2_reservations";

export const CheckStatuses = [
  "順番待ち",
  "実施決定",
  "準備中",
  "実施中",
  "合格",
  "再検査",
  "キャンセル",
] as const;
export type CheckStatus = (typeof CheckStatuses)[number];

export const CheckSides = ["ピット"] as const;
export type CheckSide = (typeof CheckSides)[number];

export class CheckReservation extends Reservation<CheckStatus, CheckSide> {
  startSize: boolean;
  r1ExpandSize: boolean;
  totalWeight: boolean;
  powerVoltage: boolean;
  emergencyStop: boolean;
  memo: string;
  recheckItems: string;

  constructor(
    options: Partial<CheckReservation> & {
      user_id: string;
      user_display_name: string;
      reservation_count: number;
      status: CheckStatus;
      side: CheckSide;
    },
  ) {
    super(options);
    this.startSize = options.startSize || false;
    this.r1ExpandSize = options.r1ExpandSize || false;
    this.totalWeight = options.totalWeight || false;
    this.powerVoltage = options.powerVoltage || false;
    this.emergencyStop = options.emergencyStop || false;
    this.memo = options.memo || "";
    this.recheckItems = options.recheckItems || "";
  }
}

export class CheckSchedule extends Schedule<CheckStatus, CheckSide> {
  constructor(initial?: CheckSchedule) {
    super(initial);
  }

  static fromUnsorted(reservations: CheckReservation[]) {
    const schedule = new CheckSchedule();

    if (reservations.length === 0) {
      console.info("まだ計量計測予約がありません");

      return schedule;
    }

    CheckSides.forEach((side) => {
      CheckStatuses.forEach((status) => {
        const filtered = reservations.filter((reservation) => {
          return reservation.side === side && reservation.status === status;
        });

        let sorted, ids;

        switch (status) {
          case "合格":
          case "再検査":
          case "キャンセル":
            sorted = filtered.sort((a, b) => {
              const aFinishedAt = a.finished_at;
              const bFinishedAt = b.finished_at;

              if (!aFinishedAt || !bFinishedAt) {
                return 0;
              }

              return aFinishedAt.getTime() - bFinishedAt.getTime();
            });
            ids = sorted.map((reservation) => reservation.id);
            break;
          case "実施中":
          case "準備中":
          case "実施決定":
            sorted = filtered.sort((a, b) => {
              const aFixedAt = a.fixed_at;
              const bFixedAt = b.fixed_at;

              if (!aFixedAt || !bFixedAt) {
                return 0;
              }

              return aFixedAt.getTime() - bFixedAt.getTime();
            });
            ids = sorted.map((reservation) => reservation.id);
            break;
          default:
            sorted = filtered.sort((a, b) => {
              return a.reserved_at.getTime() - b.reserved_at.getTime();
            });
            ids = sorted.map((reservation) => reservation.id);
        }

        schedule.set(side, status, ids);
      });
    });

    return schedule;
  }
}
