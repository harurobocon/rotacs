import { UserTable, SessionTable } from "./auth";

export interface Database {
  user: UserTable;
  session: SessionTable;
}
