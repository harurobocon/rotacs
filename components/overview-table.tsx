"use client";

import "client-only";

import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import React, { useEffect, useState, useMemo } from "react";

import { CheckCell } from "./overview-table/check-cell";
import { TestrunCell } from "./overview-table/testrun-cell";

import {
  CHECK1_COLLECTION,
  CHECK2_COLLECTION,
  CheckReservation,
  CheckStatus,
} from "@/types/check";
import { TestrunReservation, TestrunStatus } from "@/types/testrun";
import { onCheckCollectionChange } from "@/lib/client/check";
import { onTestrunCollectionChange } from "@/lib/client/testrun";

export type TeamInfo = {
  id: string;
  rowKey: string;
  displayName: string;
};

type TableRowData = TeamInfo & {
  check1: CheckStatus | "未予約" | "読込中...";
  check2: CheckStatus | "未予約" | "読込中...";
  testrun1: TestrunStatus | "未予約" | "読込中...";
  testrun2: TestrunStatus | "未予約" | "読込中...";
  testrun3: TestrunStatus | "未予約" | "読込中...";
  testrun4: TestrunStatus | "未予約" | "読込中...";
  testrun5: TestrunStatus | "未予約" | "読込中...";
};

const columns = [
  { name: "#", uid: "id" },
  { name: "チーム名", uid: "teamName" },
  { name: "計量計測1（前日）", uid: "check1" },
  { name: "計量計測2（当日）", uid: "check2" },
  { name: "テストラン1", uid: "testrun1" },
  { name: "テストラン2", uid: "testrun2" },
  { name: "テストラン3", uid: "testrun3" },
  { name: "テストラン4", uid: "testrun4" },
  { name: "テストラン5", uid: "testrun5" },
];

type OverviewTableProps = {
  teams: TeamInfo[];
};

function extractPitNumberLabel(id: string): string {
  const match = id.match(/(\d+)$/);

  return match ? match[1] : id;
}

function extractCheckStatusMap(
  docs: CheckReservation[],
): Record<string, CheckStatus> {
  const latestTimes: Record<string, number> = {};
  const statusMap: Record<string, CheckStatus> = {};

  for (const item of docs) {
    const team = item.user_display_name;

    if (!team) continue;

    const time =
      item.reserved_at instanceof Date ? item.reserved_at.getTime() : 0;

    if (latestTimes[team] === undefined || time >= latestTimes[team]) {
      latestTimes[team] = time;
      statusMap[team] = item.status;
    }
  }

  return statusMap;
}

function extractTestrunStatusMap(
  docs: TestrunReservation[],
): Record<string, TestrunStatus> {
  const latestTimes: Record<string, number> = {};
  const statusMap: Record<string, TestrunStatus> = {};

  for (const item of docs) {
    const team = item.user_display_name;
    const count = item.reservation_count;

    if (!team || count === undefined || count === null) continue;

    const key = `${team}_${count}`;
    const time =
      item.reserved_at instanceof Date ? item.reserved_at.getTime() : 0;

    if (latestTimes[key] === undefined || time >= latestTimes[key]) {
      latestTimes[key] = time;
      statusMap[key] = item.status;
    }
  }

  return statusMap;
}

export default function OverviewTable({ teams }: OverviewTableProps) {
  const [check1Map, setCheck1Map] = useState<Record<
    string,
    CheckStatus
  > | null>(null);
  const [check2Map, setCheck2Map] = useState<Record<
    string,
    CheckStatus
  > | null>(null);
  const [testrunMap, setTestrunMap] = useState<Record<
    string,
    TestrunStatus
  > | null>(null);

  useEffect(() => {
    const unsubCheck1 = onCheckCollectionChange(
      CHECK1_COLLECTION,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => doc.data());

        console.info(
          `[OverviewTable] check1 reservations received: ${docs.length}`,
        );
        setCheck1Map(extractCheckStatusMap(docs));
      },
      (error) => {
        console.error(
          "[OverviewTable] onCheckCollectionChange(check1) error:",
          error,
        );
      },
    );

    const unsubCheck2 = onCheckCollectionChange(
      CHECK2_COLLECTION,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => doc.data());

        console.info(
          `[OverviewTable] check2 reservations received: ${docs.length}`,
        );
        setCheck2Map(extractCheckStatusMap(docs));
      },
      (error) => {
        console.error(
          "[OverviewTable] onCheckCollectionChange(check2) error:",
          error,
        );
      },
    );

    const unsubTestrun = onTestrunCollectionChange(
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => doc.data());

        console.info(
          `[OverviewTable] testrun reservations received: ${docs.length}`,
        );
        setTestrunMap(extractTestrunStatusMap(docs));
      },
      (error) => {
        console.error(
          "[OverviewTable] onTestrunCollectionChange error:",
          error,
        );
      },
    );

    return () => {
      unsubCheck1();
      unsubCheck2();
      unsubTestrun();
    };
  }, []);

  const rows = useMemo<TableRowData[]>(() => {
    return teams.map((item) => {
      const teamName = item.displayName;

      return {
        ...item,
        check1: check1Map ? (check1Map[teamName] ?? "未予約") : "読込中...",
        check2: check2Map ? (check2Map[teamName] ?? "未予約") : "読込中...",
        testrun1: testrunMap
          ? (testrunMap[`${teamName}_1`] ?? "未予約")
          : "読込中...",
        testrun2: testrunMap
          ? (testrunMap[`${teamName}_2`] ?? "未予約")
          : "読込中...",
        testrun3: testrunMap
          ? (testrunMap[`${teamName}_3`] ?? "未予約")
          : "読込中...",
        testrun4: testrunMap
          ? (testrunMap[`${teamName}_4`] ?? "未予約")
          : "読込中...",
        testrun5: testrunMap
          ? (testrunMap[`${teamName}_5`] ?? "未予約")
          : "読込中...",
      };
    });
  }, [teams, check1Map, check2Map, testrunMap]);

  const renderCell = React.useCallback(
    (item: TableRowData, columnKey: React.Key) => {
      switch (columnKey) {
        case "id":
          return (
            <>
              <span className="inline md:hidden">
                {extractPitNumberLabel(item.id)}
              </span>
              <span className="hidden whitespace-nowrap md:inline">
                {item.id}
              </span>
            </>
          );
        case "teamName":
          return item.displayName;
        case "check1":
          return <CheckCell status={item.check1} />;
        case "check2":
          return <CheckCell status={item.check2} />;
        case "testrun1":
          return <TestrunCell status={item.testrun1} />;
        case "testrun2":
          return <TestrunCell status={item.testrun2} />;
        case "testrun3":
          return <TestrunCell status={item.testrun3} />;
        case "testrun4":
          return <TestrunCell status={item.testrun4} />;
        case "testrun5":
          return <TestrunCell status={item.testrun5} />;
        default:
          return null;
      }
    },
    [],
  );

  return (
    <Table
      isCompact
      isHeaderSticky
      aria-label="Overview table"
      className="w-full"
    >
      <TableHeader columns={columns}>
        {(column) => (
          <TableColumn key={column.uid} align="center">
            {column.name}
          </TableColumn>
        )}
      </TableHeader>
      <TableBody emptyContent={"No teams found"} items={rows}>
        {(item) => (
          <TableRow key={item.rowKey}>
            {(columnKey) => (
              <TableCell>{renderCell(item, columnKey)}</TableCell>
            )}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
