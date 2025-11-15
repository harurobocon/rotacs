"use client";

import { useEffect, useState } from "react";

import { checkIsAdmin } from "@/lib/server/adminCheck";

/**
 * 現在のユーザーがadminかどうかを返すカスタムhook
 * サーバーサイドの認証状態と同期する
 */
export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkAdmin = async () => {
      try {
        const adminStatus = await checkIsAdmin();

        if (mounted) {
          setIsAdmin(adminStatus);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Failed to check admin status:", error);
        if (mounted) {
          setIsAdmin(false);
          setIsLoading(false);
        }
      }
    };

    checkAdmin();

    // 定期的にadmin状態をチェック（セッション切れを検出）
    const interval = setInterval(checkAdmin, 30000); // 30秒ごと

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return { isAdmin, isLoading };
}
