import { CheckSide } from "@/types/check";

export interface DatabaseUserAttributes {
  username: string;
  display_name: string;
  role: UserRole;
  pit_side: CheckSide;
  pit_number: number;
  slack_channel_id?: string;
  plain_password?: string;
}

export interface UserTable {
  id: string;
  username: string;
  display_name: string;
  role: UserRole;
  pit_side: CheckSide;
  pit_number: number;
  slack_channel_id?: string;
  plain_password?: string;
}

export type UserRole = "admin" | "user";
