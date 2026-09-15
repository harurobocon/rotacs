"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Link } from "@heroui/react";
import { Icon } from "@iconify/react";

import { Navbar } from "@/components/navbar";
import SurveyFloat from "@/components/survey-float";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isDisplay = pathname?.startsWith("/display");

  if (isDisplay) {
    return <div className="min-h-screen w-full bg-background">{children}</div>;
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <Navbar />
      <main className="container mx-auto h-full max-w-7xl flex-grow flex-col px-2 pt-6 md:px-8">
        {children}
      </main>
      <SurveyFloat />
      <footer className="flex w-full items-center justify-center py-3">
        <Link
          isExternal
          className="flex items-center gap-1 text-current"
          href="https://github.com/harurobocon/rotacs"
          title="RoTACS GitHub Repository"
        >
          <Icon icon="mdi:github" />
          <p className="text-primary">Repository</p>
        </Link>
      </footer>
    </div>
  );
}
