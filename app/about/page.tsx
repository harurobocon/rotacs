"use client";

import { homeTitle } from "@/components/primitives";
import { useAuth } from "@/lib/contexts/AuthContext";
import { AuthGuard } from "@/components/AuthGuard";

export default function AboutPage() {
  const { user } = useAuth();

  return (
    <AuthGuard requireAuth>
      <div>
        <h1 className={homeTitle()}>Hello, {user?.email?.split('@')[0] || 'User'}!</h1>
      </div>
    </AuthGuard>
  );
}
