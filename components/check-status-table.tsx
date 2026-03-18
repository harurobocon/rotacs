"use client";

import "client-only";

import React from "react";
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
import { Icon } from "@iconify/react";

import { onCheckCollectionChange } from "@/lib/client/check";
import {
  getCheckItemsSettings,
  listenCheckItemsSettings,
} from "@/lib/client/settings";
import { CheckReservation, CheckStatus } from "@/types/check";
import { CheckItemSetting, CheckItemsSettings } from "@/types/settings";

export type TeamInfo = {
  id: string;
  rowKey: string;
  displayName: string;
};

type CheckType = "check1" | "check2";

type CheckStatusTableProps = {
  teams: TeamInfo[];
  collectionId: string;
  checkType: CheckType;
};

function extractPitNumberLabel(id: string): string {
  const match = id.match(/(\d+)$/);

  return match ? match[1] : id;
}

function getLatestReservationMap(
  reservations: CheckReservation[],
): Record<string, CheckReservation> {
  const latestByTeam: Record<string, CheckReservation> = {};

  reservations.forEach((reservation) => {
    const key = reservation.user_display_name;
    const prev = latestByTeam[key];

    if (
      !prev ||
      reservation.reserved_at.getTime() > prev.reserved_at.getTime()
    ) {
      latestByTeam[key] = reservation;
    }
  });

  return latestByTeam;
}

function formatItemValue(
  reservation: CheckReservation | undefined,
  item: CheckItemSetting,
): { text: string; title: string | undefined; color?: "success" | "danger" } {
  if (!reservation) {
    return { text: "-", title: undefined };
  }

  const value = reservation[item.id] as unknown;

  if (item.type === "boolean") {
    if (typeof value !== "boolean") {
      return { text: "-", title: undefined };
    }

    return {
      text: value ? "OK" : "NG",
      title: undefined,
      color: value ? "success" : "danger",
    };
  }

  if (item.type === "number") {
    if (value === null || value === undefined || String(value).trim() === "") {
      return { text: "-", title: undefined };
    }

    return { text: String(value), title: undefined };
  }

  const textValue =
    value === null || value === undefined ? "" : String(value).trim();

  if (textValue.length === 0) {
    return { text: "-", title: undefined };
  }

  return { text: textValue, title: textValue };
}

function getStatusChipColor(status: CheckStatus | "未予約") {
  switch (status) {
    case "順番待ち":
    case "呼出中":
    case "移動中":
      return "secondary" as const;
    case "実施中":
      return "primary" as const;
    case "合格":
      return "success" as const;
    case "再検査":
      return "warning" as const;
    case "キャンセル":
      return "danger" as const;
    default:
      return "default" as const;
  }
}

function getFinalResult(
  reservation: CheckReservation | undefined,
): "合格" | "不合格" | "-" {
  if (!reservation) {
    return "-";
  }

  if (reservation.status === "合格") {
    return "合格";
  }

  if (reservation.status === "再検査" || reservation.status === "キャンセル") {
    return "不合格";
  }

  return "-";
}

function ExpandableText({ text }: { text: string }) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div
      className="group flex cursor-pointer items-start gap-1"
      role="button"
      tabIndex={0}
      onClick={() => setIsExpanded(!isExpanded)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setIsExpanded(!isExpanded);
        }
      }}
    >
      <span
        className={
          isExpanded
            ? "whitespace-pre-wrap break-words"
            : "block max-w-[14rem] truncate whitespace-nowrap"
        }
      >
        {text}
      </span>
      <Icon
        className="mt-1 flex-shrink-0 text-default-400 transition-transform group-hover:text-default-600"
        icon={isExpanded ? "mdi:chevron-up" : "mdi:chevron-down"}
        width={16}
      />
    </div>
  );
}

export default function CheckStatusTable({
  teams,
  collectionId,
  checkType,
}: CheckStatusTableProps) {
  const [itemsSettings, setItemsSettings] =
    React.useState<CheckItemsSettings | null>(null);
  const [latestByTeam, setLatestByTeam] = React.useState<
    Record<string, CheckReservation>
  >({});

  React.useEffect(() => {
    getCheckItemsSettings().then((settings) => {
      setItemsSettings(settings);
    });

    const unsubscribeItems = listenCheckItemsSettings((settings) => {
      setItemsSettings(settings);
    });

    const unsubscribeCollection = onCheckCollectionChange(
      collectionId,
      (snapshot) => {
        const reservations = snapshot.docs.map((doc) => doc.data());

        setLatestByTeam(getLatestReservationMap(reservations));
      },
    );

    return () => {
      unsubscribeItems();
      unsubscribeCollection();
    };
  }, [collectionId]);

  const enabledItems = React.useMemo<CheckItemSetting[]>(() => {
    if (!itemsSettings) {
      return [];
    }

    return [...itemsSettings[checkType]]
      .filter((item) => item.enabled)
      .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  }, [checkType, itemsSettings]);

  const columns = React.useMemo(
    () => [
      { name: "#", uid: "id" },
      { name: "チーム名", uid: "teamName" },
      { name: "予約状況", uid: "reservationStatus" },
      { name: "最終合否", uid: "finalResult" },
      ...enabledItems.map((item) => ({
        name: item.label,
        uid: `item-${item.id}`,
      })),
    ],
    [enabledItems],
  );

  const renderCell = React.useCallback(
    (team: TeamInfo, columnKey: React.Key) => {
      const reservation = latestByTeam[team.displayName];

      if (columnKey === "id") {
        const pitNumberLabel = extractPitNumberLabel(team.id);

        return (
          <>
            <span className="inline md:hidden">{pitNumberLabel}</span>
            <span className="hidden whitespace-nowrap md:inline">
              {team.id}
            </span>
          </>
        );
      }

      if (columnKey === "teamName") {
        return team.displayName;
      }

      if (columnKey === "reservationStatus") {
        const status = reservation?.status ?? "未予約";

        return (
          <Chip color={getStatusChipColor(status)} size="sm">
            <span className="font-bold">{status}</span>
          </Chip>
        );
      }

      if (columnKey === "finalResult") {
        const finalResult = getFinalResult(reservation);

        if (finalResult === "-") {
          return "-";
        }

        const finalColor =
          finalResult === "合格"
            ? "success"
            : finalResult === "不合格"
              ? "danger"
              : "default";

        return (
          <Chip color={finalColor} size="sm">
            <span className="font-bold">{finalResult}</span>
          </Chip>
        );
      }

      const itemId = String(columnKey).replace(/^item-/, "");
      const item = enabledItems.find((v) => v.id === itemId);

      if (!item) {
        return "-";
      }

      const value = formatItemValue(reservation, item);

      if (item.type === "boolean") {
        if (value.text === "-") {
          return "-";
        }

        return (
          <Chip color={value.color ?? "default"} size="sm">
            <span className="font-bold">{value.text}</span>
          </Chip>
        );
      }

      return <ExpandableText text={value.text} />;
    },
    [enabledItems, latestByTeam],
  );

  if (!itemsSettings) {
    return <Spinner className="flex py-4" label="読み込み中..." />;
  }

  return (
    <div className="w-full overflow-x-auto">
      <Table
        isCompact
        isHeaderSticky
        aria-label="計量計測結果一覧表"
        className="min-w-[720px]"
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
                <TableCell className="align-middle">
                  {renderCell(item, columnKey)}
                </TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
