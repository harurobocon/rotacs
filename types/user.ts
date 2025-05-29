import { UserTable } from "@/types/auth";
import { Timestamp } from "firebase-admin/firestore";

export interface FirestoreUser extends UserTable {
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
