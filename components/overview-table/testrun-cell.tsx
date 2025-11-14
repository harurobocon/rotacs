"use client";

import "client-only";

import { Chip } from "@heroui/react";
import React, { useEffect, useState } from "react";

import { onTestrunChangeByTeam } from "@/lib/client/testrun";
import { TestrunStatus } from "@/types/testrun";

type TestrunCellProps = {
  teamName: string;
  testrunNumber: number;
};

export function TestrunCell({ teamName, testrunNumber }: TestrunCellProps) {
  const [status, setStatus] = useState<TestrunStatus | "未予約" | "読込中...">(
    "読込中...",
  );

  useEffect(() => {
    const unsubscribe = onTestrunChangeByTeam(
      teamName,
      testrunNumber,
      (newStatus) => {
        setStatus(newStatus);
      },
    );

    return () => unsubscribe();
  }, [teamName, testrunNumber]);

  switch (status) {
    case "順番待ち":
    case "呼出中":
    case "移動中":
    case "スタンバイ中":
      return (
        <Chip color="secondary" size="sm">
          <span className="font-bold">{status}</span>
        </Chip>
      );
    case "実施中":
      return (
        <Chip color="primary" size="sm">
          <span className="font-bold">{status}</span>
        </Chip>
      );
    case "終了":
      return (
        <Chip color="success" size="sm">
          <span className="font-bold">{status}</span>
        </Chip>
      );
    case "キャンセル":
      return (
        <Chip color="danger" size="sm">
          <span className="font-bold">{status}</span>
        </Chip>
      );
    default:
      return (
        <Chip color="default" size="sm">
          <span className="font-bold">{status}</span>
        </Chip>
      );
  }
}
