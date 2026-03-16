"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

import { useAuth } from "@/lib/contexts/AuthContext";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
}

export function AuthGuard({
  children,
  requireAuth = false,
  requireAdmin = false,
}: AuthGuardProps) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    if (requireAuth && !user) {
      router.push(`/login?redirect=${pathname}`);

      return;
    }

    if (requireAdmin && !isAdmin) {
      router.push("/settings");

      return;
    }
  }, [user, loading, isAdmin, requireAuth, requireAdmin, router, pathname]);

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p>読み込み中...</p>
      </div>
    );
  }

  if (requireAuth && !user) {
    return null;
  }

  if (requireAdmin && !isAdmin) {
    return null;
  }

  return <>{children}</>;
}
