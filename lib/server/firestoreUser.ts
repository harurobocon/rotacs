import { env } from "process";

import { Timestamp } from "firebase-admin/firestore";

import { FirestoreUser } from "@/types/user";
import { getFirestore } from "@/lib/firebase/serverApp";

const COLLECTION_NAME = env.NEXT_PUBLIC_USER_COLLECTION || "user";

export async function upsertUserToFirestore(
  user: FirestoreUser,
): Promise<void> {
  const db = await getFirestore();

  user.createdAt = Timestamp.now();
  user.updatedAt = Timestamp.now();

  await db.collection(COLLECTION_NAME).doc(user.id).set(user);
}

export async function deleteUserFromFirestore(userId: string): Promise<void> {
  const db = await getFirestore();

  await db.collection(COLLECTION_NAME).doc(userId).delete();
}

export async function getUserFromFirestore(
  userId: string,
): Promise<FirestoreUser | null> {
  const db = await getFirestore();
  const doc = await db.collection(COLLECTION_NAME).doc(userId).get();

  if (!doc.exists) return null;

  return doc.data() as FirestoreUser;
}
