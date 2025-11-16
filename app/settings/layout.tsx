"use client";

import React from "react";

import SettingTabs from "@/components/settings/setting-tabs";
import {
  pageContainer,
  pageSubtitle,
  pageTitle,
} from "@/components/primitives";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/lib/contexts/AuthContext";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdmin } = useAuth();

  return (
    <AuthGuard requireAuth>
      <div className={pageContainer()}>
        {/* Title */}
        <div className="flex-col items-center">
          <h1 className={pageTitle()}>設定</h1>
          <h2 className={pageSubtitle()}>設定の確認と変更ができます．</h2>
        </div>
        <SettingTabs isAdmin={isAdmin} />
        {children}
      </div>
    </AuthGuard>
  );
}
