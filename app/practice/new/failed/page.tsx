"use client";

import "client-only";

import React from "react";
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";

import { pageContainer } from "@/components/primitives";

export default function NewPracticeFailed() {
  const searchParams = new URLSearchParams(window.location.search);
  const message = searchParams.get("message");

  return (
    <div className={pageContainer()}>
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex w-full max-w-sm flex-col gap-4 rounded-large bg-content1 px-8 pb-10 pt-6 shadow-small">
          <div className="flex flex-col items-center gap-4">
            <Icon className="text-6xl text-danger" icon="mdi:close-circle" />
            <p className="text-xl font-medium">予約に失敗しました</p>
            <p className="text-center text-default-500">{message}</p>
            <Button
              as="a"
              className="mt-4"
              color="primary"
              href="/practice"
              startContent={<Icon icon="mdi:arrow-left" />}
            >
              試走場予約に戻る
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
