"use client";

import "client-only";

import { auth } from "@/lib/firebase/clientApp";

export async function isAdmin() {
  const user = auth.currentUser;

  if (!user) {
    return false;
  }

  const tokenResult = await user.getIdTokenResult();

  return tokenResult.claims.admin === true;
}
