"use server";

import "server-cli-only";

import { getFirestore } from "@/lib/firebase/serverApp";
import { FirestoreUser } from "@/types/user";

const USER_COLLECTION = process.env.NEXT_PUBLIC_USER_COLLECTION || "users";

/**
 * Get user from Firestore by user ID
 */
export async function getFirestoreUserById(
  userId: string,
): Promise<FirestoreUser | null> {
  try {
    const db = await getFirestore();
    const userDoc = await db.collection(USER_COLLECTION).doc(userId).get();

    if (!userDoc.exists) {
      return null;
    }

    return userDoc.data() as FirestoreUser;
  } catch (error) {
    console.error("Error getting user from Firestore:", error);

    return null;
  }
}

/**
 * Get all users from Firestore
 */
export async function getAllFirestoreUsers(): Promise<FirestoreUser[]> {
  try {
    const db = await getFirestore();
    const usersSnapshot = await db.collection(USER_COLLECTION).get();

    return usersSnapshot.docs.map((doc) => doc.data() as FirestoreUser);
  } catch (error) {
    console.error("Error getting users from Firestore:", error);

    return [];
  }
}
