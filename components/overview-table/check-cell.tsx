"use client";

import "client-only";

import { Chip } from "@heroui/react";
import React from "react";

import { CheckStatus } from "@/types/check";

type CheckCellProps = {
  status: CheckStatus | "未予約" | "読込中...";
};

export function CheckCell({ status }: CheckCellProps) {
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
