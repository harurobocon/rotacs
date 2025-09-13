"use client";

import "client-only";

import { Chip } from "@heroui/react";
import React, { useEffect, useState } from "react";

import { onCheckChangeByTeam } from "@/lib/client/check";
import { CheckStatus } from "@/types/check";

type CheckCellProps = {
  teamName: string;
  collectionId: string;
};

export function CheckCell({ teamName, collectionId }: CheckCellProps) {
  const [status, setStatus] = useState<CheckStatus | "未予約" | "読込中...">(
    "読込中...",
  );

  useEffect(() => {
    const unsubscribe = onCheckChangeByTeam(
      collectionId,
      teamName,
      (newStatus) => {
        setStatus(newStatus);
      },
    );

    return () => unsubscribe();
  }, [collectionId, teamName]);

  switch (status) {
    case "順番待ち":
    case "呼出中":
    case "移動中":
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
    case "合格":
      return (
        <Chip color="success" size="sm">
          <span className="font-bold">{status}</span>
        </Chip>
      );
    case "再検査":
      return (
        <Chip color="warning" size="sm">
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
