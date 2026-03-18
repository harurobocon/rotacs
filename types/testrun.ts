import { Reservation, Schedule } from "@/types/reservation";

export const TESTRUN_COLLECTION =
  process.env.NEXT_PUBLIC_TESTRUN_RESERVATION_COLLECTION ||
  "testrun_reservations";

export const TestrunStatuses = [
  "順番待ち",
  "呼出中",
  "移動中",
  "スタンバイ中",
  "実施中",
  "終了",
  "キャンセル",
] as const;
export type TestrunStatus = (typeof TestrunStatuses)[number];

export const TestrunSides = ["赤", "青"] as const;
export type TestrunSide = (typeof TestrunSides)[number];

export class TestrunReservation extends Reservation<
  TestrunStatus,
  TestrunSide
> {
  robot_check_enabled?: boolean;

  constructor(
    options: Partial<TestrunReservation> & {
      user_id: string;
      user_display_name: string;
      reservation_count: number;
      status: TestrunStatus;
      side: TestrunSide;
    },
  ) {
    super(options);
    this.robot_check_enabled = options.robot_check_enabled ?? false;
  }
}

export class TestrunSchedule extends Schedule<TestrunStatus, TestrunSide> {
  constructor(initial?: TestrunSchedule) {
    super(initial);
  }

  static fromUnsorted(reservations: TestrunReservation[]) {
    const schedule = new TestrunSchedule();

    if (reservations.length === 0) {
      console.info("まだテストラン予約がありません");

      return schedule;
    }

    TestrunSides.forEach((side) => {
      TestrunStatuses.forEach((status) => {
        const filtered = reservations.filter((reservation) => {
          return reservation.side === side && reservation.status === status;
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
            schedule.set(side, status, ids);
            break;
          case "呼出中":
          case "移動中":
          case "スタンバイ中":
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
            schedule.set(side, status, ids);
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
            schedule.set(side, status, ids);
            break;
        }
      });
    });

    return schedule;
  }
}
