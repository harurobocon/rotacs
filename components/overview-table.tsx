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

const TEAM_NAMES = [
  { displayName: "旭川", id: 1 },
  { displayName: "函館", id: 2 },
  { displayName: "仙台広瀬", id: 3 },
  { displayName: "仙台名取", id: 4 },
  { displayName: "一関", id: 5 },
  { displayName: "小山", id: 6 },
  { displayName: "木更津", id: 7 },
  { displayName: "東京", id: 8 },
  { displayName: "産技荒川", id: 9 },
  { displayName: "富山射水", id: 10 },
  { displayName: "鈴鹿", id: 11 },
  { displayName: "国際", id: 12 },
  { displayName: "富山本郷", id: 13 },
  { displayName: "奈良", id: 14 },
  { displayName: "明石", id: 15 },
  { displayName: "神戸", id: 16 },
  { displayName: "米子", id: 17 },
  { displayName: "呉", id: 18 },
  { displayName: "広島商船", id: 19 },
  { displayName: "香川高松", id: 20 },
  { displayName: "高知", id: 21 },
  { displayName: "熊本熊本", id: 22 },
  { displayName: "鹿児島", id: 23 },
  { displayName: "熊本八代", id: 24 },
  { displayName: "都城", id: 25 },
];

const columns = [
  { name: "#", uid: "id" },
  { name: "チーム名", uid: "teamName" },
  { name: "計量計測1（土）", uid: "check1" },
  { name: "計量計測2（日）", uid: "check2" },
  { name: "テストラン1", uid: "testrun1" },
  { name: "テストラン2", uid: "testrun2" },
  { name: "テストラン3", uid: "testrun3" },
  { name: "テストラン4", uid: "testrun4" },
  { name: "テストラン5", uid: "testrun5" },
];

type TeamInfo = (typeof TEAM_NAMES)[number];

export default function OverviewTable() {
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
      <TableBody emptyContent={"No teams found"} items={TEAM_NAMES}>
        {(item) => (
          <TableRow key={item.id}>
            {(columnKey) => (
              <TableCell>{renderCell(item, columnKey)}</TableCell>
            )}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
