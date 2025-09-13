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
  { displayName: "Technologier", id: 1 },
  { displayName: "情メカ", id: 2 },
  { displayName: "おいでよ！常盤の森", id: 3 },
  { displayName: "とびだせ ! 常盤の森", id: 4 },
  { displayName: "あつまれ！常盤の森", id: 5 },
  { displayName: "Ti-Robot", id: 6 },
  { displayName: "Maqui", id: 7 },
  { displayName: "Nista", id: 8 },
  { displayName: "つくばろぼっとサークル", id: 9 },
  { displayName: "野沢菜☆サイボーグ", id: 10 },
  { displayName: "群情", id: 11 },
  { displayName: "信州の夏休み", id: 12 },
  { displayName: "HAMTAN'S", id: 13 },
  { displayName: "Bee取る`s", id: 14 },
  { displayName: "Ai-Robot", id: 15 },
  { displayName: "小金井ビートルズ", id: 16 },
  { displayName: "昆虫ハンター ヒガコ", id: 17 },
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
