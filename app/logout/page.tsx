"use client";

import "client-only";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/clientApp";

export default function Logout() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingOut(true);
    
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-large bg-content1 px-8 pb-10 pt-6 shadow-small">
        <p className="pb-2 text-xl font-medium">ログアウト</p>
        <form
          className="flex flex-col gap-3"
          onSubmit={handleSubmit}
        >
          <Button color="primary" isLoading={isLoggingOut} type="submit">
            ログアウト
          </Button>
        </form>
      </div>
    </div>
  );
}
