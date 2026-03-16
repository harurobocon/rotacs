"use server";

import "server-cli-only";

/**
 * Server-side admin check is no longer needed with Firebase Auth
 * Admin status is checked via Firebase Custom Claims on the client side
 * and enforced by Firestore Security Rules on the server side
 *
 * This function is kept for backward compatibility but always returns false
 * Components should use the useAuth() hook instead
 */
export async function checkIsAdmin(): Promise<boolean> {
  // This function is deprecated and should not be used
  // Use useAuth() hook on the client side instead
  return false;
}
