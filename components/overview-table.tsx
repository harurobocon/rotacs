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
  { displayName: "Maquinista", id: 1 },
  { displayName: "パッパカ響動隊", id: 2 },
  { displayName: "オムオム", id: 3 },
  { displayName: "威風堂々", id: 5 },
  { displayName: "独STEP", id: 6 },
  { displayName: "過デンリュウ", id: 7 },
  { displayName: "横浜狂詩曲", id: 8 },
  { displayName: "Ti-Robot", id: 9 },
  { displayName: "The Canon", id: 10 },
  { displayName: "spArc", id: 11 },
  { displayName: "プロジェクトキカイ", id: 12 },
  { displayName: "ラリルレロボコンズ", id: 13 },
  { displayName: "科学技術研究部", id: 14 },
  { displayName: "牛乳プリン", id: 15 },
  { displayName: "conductor", id: 16 },
  { displayName: "とよたしロボコンブ", id: 17 },
  { displayName: "情メカ", id: 18 },
  { displayName: "marc h", id: 19 },
  { displayName: "藤原こうふ店", id: 20 },
  { displayName: "三飾団子", id: 21 },
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
