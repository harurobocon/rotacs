"use client";

import "client-only";

import {
  Chip,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import React from "react";
import { useAsyncList } from "@react-stately/data";

import { CHECK1_COLLECTION, CHECK2_COLLECTION } from "@/types/check";
import { getCheckStatus, onCheckCollectionChange } from "@/lib/client/check";
import { TestrunStatus } from "@/types/testrun";
import {
  getTestrunStatus,
  onTestrunCollectionChange,
} from "@/lib/client/testrun";

const TEAM_NAMES = [
  { displayName: "旭川", id: 1 },
  { displayName: "函館", id: 2 },
  { displayName: "一関", id: 3 },
  { displayName: "福島", id: 4 },
  { displayName: "鶴岡", id: 5 },
  { displayName: "小山", id: 6 },
  { displayName: "木更津", id: 7 },
  { displayName: "産技荒川", id: 8 },
  { displayName: "茨城", id: 9 },
  { displayName: "富山射水", id: 10 },
  { displayName: "沼津", id: 11 },
  { displayName: "石川", id: 12 },
  { displayName: "豊田", id: 13 },
  { displayName: "奈良", id: 14 },
  { displayName: "大阪公大", id: 15 },
  { displayName: "神戸市立", id: 16 },
  { displayName: "呉", id: 17 },
  { displayName: "米子", id: 18 },
  { displayName: "大島商船", id: 19 },
  { displayName: "香川高松", id: 20 },
  { displayName: "香川詫間", id: 21 },
  { displayName: "阿南", id: 22 },
  { displayName: "熊本八代", id: 23 },
  { displayName: "熊本熊本", id: 24 },
  { displayName: "大分", id: 25 },
  { displayName: "北九州", id: 26 },
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

type OverviewItem = {
  id: number;
  teamName: string;
  check1: string;
  check2: string;
  testrun1: string;
  testrun2: string;
  testrun3: string;
  testrun4: string;
  testrun5: string;
};

export default function OverviewTable() {
  const [isTableLoading, setIsTableLoading] = React.useState(true);

  const overviewList = useAsyncList<OverviewItem>({
    async load() {
      // Load data from server
      const promises = TEAM_NAMES.map(async (teamName) => {
        const check1 = await getCheckStatus(
          teamName.displayName,
          CHECK1_COLLECTION,
        );
        const check2 = await getCheckStatus(
          teamName.displayName,
          CHECK2_COLLECTION,
        );

        let testrunStatus: (TestrunStatus | "未予約")[] = [];

        for (let i = 1; i <= 5; i++) {
          testrunStatus[i] = await getTestrunStatus(teamName.displayName, i);
        }

        const overviewItem: OverviewItem = {
          id: teamName.id,
          teamName: teamName.displayName,
          check1: check1,
          check2: check2,
          testrun1: testrunStatus[1],
          testrun2: testrunStatus[2],
          testrun3: testrunStatus[3],
          testrun4: testrunStatus[4],
          testrun5: testrunStatus[5],
        };

        return overviewItem;
      });

      const overviewList = await Promise.all(promises);

      setIsTableLoading(false);

      return {
        items: overviewList,
      };
    },
  });

  // チーム別表示のアップデートイベントハンドラ登録
  React.useEffect(() => {
    setIsTableLoading(true);

    return onCheckCollectionChange(CHECK1_COLLECTION, () => {
      overviewList.reload();
    });
  }, []);

  React.useEffect(() => {
    setIsTableLoading(true);

    return onCheckCollectionChange(CHECK2_COLLECTION, () => {
      overviewList.reload();
    });
  }, []);

  React.useEffect(() => {
    setIsTableLoading(true);

    return onTestrunCollectionChange(() => {
      overviewList.reload();
    });
  }, []);

  const renderCell = React.useCallback(
    (item: OverviewItem, columnKey: keyof OverviewItem) => {
      switch (columnKey) {
        case "check1":
        case "check2":
          switch (item[columnKey]) {
            case "順番待ち":
            case "実施決定":
            case "準備中":
              return (
                <Chip color="secondary" size="sm">
                  <span className="font-bold">{item[columnKey]}</span>
                </Chip>
              );
            case "実施中":
              return (
                <Chip color="primary" size="sm">
                  <span className="font-bold">{item[columnKey]}</span>
                </Chip>
              );
            case "合格":
              return (
                <Chip color="success" size="sm">
                  <span className="font-bold">{item[columnKey]}</span>
                </Chip>
              );
            case "再検査":
              return (
                <Chip color="warning" size="sm">
                  <span className="font-bold">{item[columnKey]}</span>
                </Chip>
              );
            case "キャンセル":
              return (
                <Chip color="danger" size="sm">
                  <span className="font-bold">{item[columnKey]}</span>
                </Chip>
              );
            default:
              return (
                <Chip color="default" size="sm">
                  <span className="font-bold">{item[columnKey]}</span>
                </Chip>
              );
          }
        case "testrun1":
        case "testrun2":
        case "testrun3":
        case "testrun4":
        case "testrun5":
          switch (item[columnKey]) {
            case "順番待ち":
            case "実施決定":
            case "準備中":
              return (
                <Chip color="secondary" size="sm">
                  <span className="font-bold">{item[columnKey]}</span>
                </Chip>
              );
            case "実施中":
              return (
                <Chip color="primary" size="sm">
                  <span className="font-bold">{item[columnKey]}</span>
                </Chip>
              );
            case "終了":
              return (
                <Chip color="success" size="sm">
                  <span className="font-bold">{item[columnKey]}</span>
                </Chip>
              );
            case "キャンセル":
              return (
                <Chip color="danger" size="sm">
                  <span className="font-bold">{item[columnKey]}</span>
                </Chip>
              );
            default:
              return (
                <Chip color="default" size="sm">
                  <span className="font-bold">{item[columnKey]}</span>
                </Chip>
              );
          }
        default:
          return item[columnKey as keyof OverviewItem];
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
        {(columns) => (
          <TableColumn key={columns.uid} align="center">
            {columns.name}
          </TableColumn>
        )}
      </TableHeader>
      <TableBody
        emptyContent={"No teams found"}
        isLoading={isTableLoading}
        items={overviewList.items}
        loadingContent={<Spinner label="ロード中..." />}
      >
        {(item) => (
          <TableRow key={item.teamName}>
            {(columnKey) => (
              <TableCell key={columnKey}>
                {renderCell(item, columnKey as keyof OverviewItem)}
              </TableCell>
            )}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
