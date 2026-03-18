import { ulid } from "ulid";

export class Reservation<StatusType extends string, SideType extends string> {
  readonly id: string;
  reserved_at: Date;
  fixed_at: Date | null;
  started_at: Date | null;
  finished_at: Date | null;
  user_id: string;
  user_display_name: string;
  reservation_count: number;
  status: StatusType;
  side: SideType;
  pre_call_sent: boolean;
  call_sent: boolean;
  pit_number: number | null;

  constructor(
    options: Partial<Reservation<StatusType, SideType>> & {
      user_id: string;
      user_display_name: string;
      reservation_count: number;
      status: StatusType;
      side: SideType;
    },
  ) {
    this.id = options.id ?? ulid();
    this.reserved_at = options.reserved_at ?? new Date();
    this.fixed_at = options.fixed_at ?? null;
    this.started_at = options.started_at ?? null;
    this.finished_at = options.finished_at ?? null;
    this.user_id = options.user_id;
    this.user_display_name = options.user_display_name;
    this.reservation_count = options.reservation_count;
    this.status = options.status;
    this.side = options.side;
    this.pre_call_sent = options.pre_call_sent ?? false;
    this.call_sent = options.call_sent ?? false;
    this.pit_number = options.pit_number ?? null;
  }
}

export type ScheduleType<StatusType extends string, SideType extends string> = {
  [key in SideType]: {
    [key in StatusType]: string[];
  };
};

export class Schedule<StatusType extends string, SideType extends string> {
  schedule: ScheduleType<StatusType, SideType>;

  constructor(initial?: Schedule<StatusType, SideType>) {
    this.schedule = initial?.schedule ?? ({} as any);
  }

  get(side: SideType, status: StatusType) {
    return this.schedule[side]?.[status] ?? [];
  }

  set(side: SideType, status: StatusType, reservation_ids: string[]) {
    this.schedule[side] = this.schedule[side] ?? {};
    this.schedule[side][status] = reservation_ids;
  }

  // static fromUnsorted(reservations: Reservation<StatusType, SideType>[]) {;
}
