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

import { CHECK1_COLLECTION, CHECK2_COLLECTION } from "@/types/check";

import { CheckCell } from "./overview-table/check-cell";
import { TestrunCell } from "./overview-table/testrun-cell";

const TEAM_NAMES = [
  { displayName: "東北大", id: 1 },
  { displayName: "工学院大", id: 2 },
  { displayName: "電気通信大", id: 3 },
  { displayName: "東京工科大", id: 4 },
  { displayName: "東京科学大", id: 5 },
  { displayName: "東京大", id: 6 },
  { displayName: "東京農工大", id: 7 },
  { displayName: "早稲田大", id: 8 },
  { displayName: "長岡技科大", id: 9 },
  { displayName: "金沢工業大", id: 10 },
  { displayName: "豊橋技科大", id: 11 },
  { displayName: "立命館大", id: 12 },
  { displayName: "京都大", id: 13 },
  { displayName: "京都工繊大", id: 14 },
  { displayName: "大阪大", id: 15 },
  { displayName: "大阪工業大", id: 16 },
  { displayName: "九州大", id: 17 },
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
            <CheckCell teamName={teamName} collectionId={CHECK1_COLLECTION} />
          );
        case "check2":
          return (
            <CheckCell teamName={teamName} collectionId={CHECK2_COLLECTION} />
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
      <TableBody items={TEAM_NAMES} emptyContent={"No teams found"}>
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
