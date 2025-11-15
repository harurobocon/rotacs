"use server";

import "server-cli-only";

import { validateRequest } from "@/lib/server/auth";

/**
 * 現在のユーザーがadminかどうかを確認する
 * Server Actionとして使用
 */
export async function checkIsAdmin(): Promise<boolean> {
  const { user } = await validateRequest();

  if (!user) {
    return false;
  }

  return user.role === "admin";
}
