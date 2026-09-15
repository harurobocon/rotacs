"use client";

import "client-only";

import { Chip } from "@heroui/react";
import React from "react";

import { TestrunStatus } from "@/types/testrun";

type TestrunCellProps = {
  status: TestrunStatus | "未予約" | "読込中...";
};

export function TestrunCell({ status }: TestrunCellProps) {
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
