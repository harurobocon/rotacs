"use server";

import "server-cli-only";

import { getAuth } from "@/lib/firebase/serverApp";
import { getFirestore } from "@/lib/firebase/serverApp";
import { ActionResult } from "@/types/actions";
import { CheckSide } from "@/types/check";

const USER_COLLECTION = process.env.NEXT_PUBLIC_USER_COLLECTION || "users";

/**
 * Create a new Firebase user with email and password
 * Only admins can call this function (enforced by Firestore Rules)
 */
export async function createFirebaseUser(
  username: string,
  password: string,
  display_name: string,
  role: "admin" | "user",
  pit_side: CheckSide,
  pit_number: number,
): Promise<ActionResult> {
  // Validate username
  if (
    typeof username !== "string" ||
    username.length < 3 ||
    username.length > 31 ||
    !/^[a-z0-9_-]+$/.test(username)
  ) {
    return {
      errors: "Invalid username",
    };
  }

  // Validate password
  if (
    typeof password !== "string" ||
    password.length < 6 ||
    password.length > 255
  ) {
    return {
      errors: "Invalid password",
    };
  }

  try {
    const auth = await getAuth();
    const firestore = await getFirestore();

    // Convert username to email format
    const email = `${username}@rotacs.yuchi.jp`;

    // Create Firebase Auth user
    const userRecord = await auth.createUser({
      email,
      password,
      emailVerified: true,
    });

    // Set custom claims for admin
    if (role === "admin") {
      await auth.setCustomUserClaims(userRecord.uid, { admin: true });
    }

    // Create user document in Firestore
    await firestore.collection(USER_COLLECTION).doc(userRecord.uid).set({
      id: userRecord.uid,
      username,
      display_name,
      role,
      pit_side,
      pit_number,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return {};
  } catch (error: any) {
    console.error("Error creating user:", error);

    if (error.code === "auth/email-already-exists") {
      return { errors: "このユーザー名は既に使用されています" };
    }

    return {
      errors: `Failed to create user: ${error.message}`,
    };
  }
}

/**
 * Delete a Firebase user
 * Only admins can call this function (enforced by Firestore Rules)
 */
export async function deleteFirebaseUser(
  userId: string,
): Promise<ActionResult> {
  try {
    const auth = await getAuth();
    const firestore = await getFirestore();

    // Delete from Firebase Auth
    await auth.deleteUser(userId);

    // Delete from Firestore
    await firestore.collection(USER_COLLECTION).doc(userId).delete();

    return {};
  } catch (error: any) {
    console.error("Error deleting user:", error);

    return {
      errors: `Failed to delete user: ${error.message}`,
    };
  }
}

/**
 * Update user's custom claims (admin status)
 */
export async function updateUserRole(
  userId: string,
  role: "admin" | "user",
): Promise<ActionResult> {
  try {
    const auth = await getAuth();
    const firestore = await getFirestore();

    // Update custom claims
    await auth.setCustomUserClaims(userId, {
      admin: role === "admin",
    });

    // Update Firestore document
    await firestore.collection(USER_COLLECTION).doc(userId).update({
      role,
      updatedAt: new Date(),
    });

    return {};
  } catch (error: any) {
    console.error("Error updating user role:", error);

    return {
      errors: `Failed to update user role: ${error.message}`,
    };
  }
}
