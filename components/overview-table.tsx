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
  { displayName: "蜜熊工房", id: 1 },
  { displayName: "はちのこ☆ロボコンズ", id: 2 },
  { displayName: "ハニーワーカー", id: 3 },
  { displayName: "回熊", id: 4 },
  { displayName: "精蜜研", id: 5 },
  { displayName: "しゅんぶんぶん", id: 6 },
  { displayName: "大熊猫", id: 7 },
  { displayName: "とある蜂蜜の射出機構", id: 8 },
  { displayName: "大熊重信", id: 9 },
  { displayName: "蜂蜂金蜜", id: 10 },
  { displayName: "ずっと最速で良いのに。", id: 11 },
  { displayName: "Maquinista", id: 12 },
  { displayName: "科学技術研究部", id: 13 },
  { displayName: "B", id: 14 },
  { displayName: "情メカ", id: 15 },
  { displayName: "蜜のメカ探検隊", id: 16 },
  { displayName: "ハニーギャザーズ", id: 17 },
  { displayName: "はにかむメカ", id: 18 },
  { displayName: "鵥", id: 19 },
  { displayName: "ヴォイテック隊長", id: 20 },
  { displayName: "BeeMead", id: 21 },
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
            case "呼出中":
            case "移動中":
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
            case "呼出中":
            case "移動中":
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
