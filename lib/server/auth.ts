"use server";

import "server-cli-only";

/**
 * Firebase Authentication Migration
 * 
 * This file previously contained Lucia-based authentication functions.
 * Authentication is now handled by:
 * - Firebase Authentication (client-side) for login/logout
 * - Firebase Custom Claims for admin status
 * - Firestore Security Rules for authorization
 * 
 * User management functions have been moved to:
 * - lib/server/firebaseAuth.ts (create/delete users, set admin claims)
 * - lib/server/firestoreUser.ts (Firestore user CRUD)
 * - lib/server/firestoreUserHelpers.ts (get user helpers)
 * 
 * For admin checks in components, use:
 * - useAuth() hook (client-side)
 * - Firebase Admin SDK verifyIdToken() for server-side validation if needed
 */

export {}; // Make this a module
