import { Timestamp } from "firebase-admin/firestore";

import { UserTable } from "@/types/auth";

export interface FirestoreUser extends UserTable {
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
