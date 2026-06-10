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

function getTimestamp(val: any): number {
  if (!val) {
    return Date.now();
  }
  if (val instanceof Date) {
    return val.getTime();
  }
  if (typeof val === "object" && typeof val.toDate === "function") {
    return val.toDate().getTime();
  }
  const d = new Date(val);

  return isNaN(d.getTime()) ? Date.now() : d.getTime();
}

export class TestrunSchedule extends Schedule<TestrunStatus, TestrunSide> {
  unified: {
    [key in TestrunStatus]?: Array<{
      id: string;
      side: TestrunSide;
      isSpacer: boolean;
    }>;
  };

  constructor(initial?: TestrunSchedule) {
    super(initial);
    this.unified = initial?.unified ?? {};
  }

  getUnified(status: TestrunStatus) {
    return this.unified[status] ?? [];
  }

  static fromUnsorted(
    reservations: TestrunReservation[],
    unifiedStatuses: TestrunStatus[] = ["呼出中", "移動中", "スタンバイ中"],
  ) {
    const schedule = new TestrunSchedule();

    if (reservations.length === 0) {
      console.info("まだテストラン予約がありません");

      return schedule;
    }

    schedule.unified = {};

    TestrunSides.forEach((side) => {
      TestrunStatuses.forEach((status) => {
        // Skip side-by-side processing for unified statuses
        if (unifiedStatuses.includes(status)) {
          return;
        }

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
          default: // "順番待ち"
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

    // Process unified statuses
    unifiedStatuses.forEach((status) => {
      const filtered = reservations.filter((r) => r.status === status);

      const sorted = filtered.sort((a, b) => {
        const aTime = getTimestamp(a.fixed_at);
        const bTime = getTimestamp(b.fixed_at);

        return aTime - bTime;
      });

      // Populate standard schedule side-by-side for compatibility (e.g. Slack notifications)
      TestrunSides.forEach((side) => {
        const sideIds = sorted.filter((r) => r.side === side).map((r) => r.id);

        schedule.set(side, status, sideIds);
      });

      // Build unified list with spacers
      const items: Array<{ id: string; side: TestrunSide; isSpacer: boolean }> =
        [];

      sorted.forEach((r) => {
        if (r.side === "赤") {
          items.push({ id: r.id, side: "赤", isSpacer: false });
          items.push({ id: `${r.id}-spacer`, side: "青", isSpacer: true });
        } else {
          items.push({ id: `${r.id}-spacer`, side: "赤", isSpacer: true });
          items.push({ id: r.id, side: "青", isSpacer: false });
        }
      });

      schedule.unified[status] = items;
    });

    return schedule;
  }
}
