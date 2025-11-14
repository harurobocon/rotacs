import { Reservation, Schedule } from "@/types/reservation";

export const CHECK1_COLLECTION =
  process.env.NEXT_PUBLIC_CHECK1_RESERVATION_COLLECTION ||
  "check1_reservations";
export const CHECK2_COLLECTION =
  process.env.NEXT_PUBLIC_CHECK2_RESERVATION_COLLECTION ||
  "check2_reservations";

export const CheckStatuses = [
  "順番待ち",
  "呼出中",
  "移動中",
  "実施中",
  "合格",
  "再検査",
  "キャンセル",
] as const;
export type CheckStatus = (typeof CheckStatuses)[number];

// CheckSideは動的に変化するため、型定義のみ
export type CheckSide = "ピット" | "西" | "東";

// 実行時の実際のsides配列を返すヘルパー関数
export function getCheckSides(mode: "single" | "dual"): CheckSide[] {
  return mode === "dual" ? ["西", "東"] : ["ピット"];
}

// 下位互換性のため、デフォルト値として維持
export const CheckSides: CheckSide[] = ["ピット"];

export class CheckReservation extends Reservation<CheckStatus, CheckSide> {
  size: boolean;
  weight: boolean;
  emergencyStop: boolean;
  led: boolean;
  power: boolean;
  compressedAir: boolean;
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
    this.size = options.size || false;
    this.weight = options.weight || false;
    this.emergencyStop = options.emergencyStop || false;
    this.led = options.led || false;
    this.power = options.power || false;
    this.compressedAir = options.compressedAir || false;
    this.memo = options.memo || "";
    this.recheckItems = options.recheckItems || "";
  }
}

export class CheckSchedule extends Schedule<CheckStatus, CheckSide> {
  constructor(initial?: CheckSchedule) {
    super(initial);
  }

  static fromUnsorted(
    reservations: CheckReservation[],
    mode: "single" | "dual",
  ) {
    const schedule = new CheckSchedule();

    if (reservations.length === 0) {
      // まだ計量計測予約がありません
      return schedule;
    }

    // モード設定に基づいて有効なsideを決定
    const validSides = getCheckSides(mode);

    validSides.forEach((side) => {
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
          case "移動中":
          case "呼出中":
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
