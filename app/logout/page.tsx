"use client";

import "client-only";

import React from "react";
import { Button } from "@heroui/react";

import { logout } from "@/lib/server/auth";

export default function Logout() {
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);

  const handleSubmit = () => {
    setIsLoggingIn(true);
  };

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-large bg-content1 px-8 pb-10 pt-6 shadow-small">
        <p className="pb-2 text-xl font-medium">ログアウト</p>
        <form
          action={logout}
          className="flex flex-col gap-3"
          onSubmit={handleSubmit}
        >
          <Button color="primary" isLoading={isLoggingIn} type="submit">
            ログアウト
          </Button>
        </form>
      </div>
    </div>
  );
}
