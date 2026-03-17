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
import React from "react";

import { CheckCell } from "./overview-table/check-cell";
import { TestrunCell } from "./overview-table/testrun-cell";

import { CHECK1_COLLECTION, CHECK2_COLLECTION } from "@/types/check";

export type TeamInfo = {
  id: string;
  rowKey: string;
  displayName: string;
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

export default function OverviewTable({ teams }: OverviewTableProps) {
  const renderCell = React.useCallback(
    (item: TeamInfo, columnKey: React.Key) => {
      const teamName = item.displayName;

      switch (columnKey) {
        case "id":
          return item.id;
        case "teamName":
          return teamName;
        case "check1":
          return (
            <CheckCell collectionId={CHECK1_COLLECTION} teamName={teamName} />
          );
        case "check2":
          return (
            <CheckCell collectionId={CHECK2_COLLECTION} teamName={teamName} />
          );
        case "testrun1":
          return <TestrunCell teamName={teamName} testrunNumber={1} />;
        case "testrun2":
          return <TestrunCell teamName={teamName} testrunNumber={2} />;
        case "testrun3":
          return <TestrunCell teamName={teamName} testrunNumber={3} />;
        case "testrun4":
          return <TestrunCell teamName={teamName} testrunNumber={4} />;
        case "testrun5":
          return <TestrunCell teamName={teamName} testrunNumber={5} />;
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
      <TableBody emptyContent={"No teams found"} items={teams}>
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
