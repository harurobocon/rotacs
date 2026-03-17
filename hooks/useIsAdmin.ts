"use client";

import { useAuth } from "@/lib/contexts/AuthContext";

/**
 * 現在のユーザーがadminかどうかを返すカスタムhook
 * Firebase Authentication Custom Claimsを使用
 */
export function useIsAdmin() {
  const { isAdmin, loading } = useAuth();

  return { isAdmin, isLoading: loading };
}
