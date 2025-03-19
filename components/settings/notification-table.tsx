"use client";

import "client-only";

import {
  Card,
  CardBody,
  Table,
  Selection,
  TableHeader,
  TableBody,
  TableColumn,
  Spinner,
  TableRow,
  TableCell,
  Button,
  Input,
} from "@heroui/react";
import React from "react";
import { useAsyncList } from "@react-stately/data";

import { cardStyles } from "@/components/settings/styles";
import { LineNotifyToken } from "@/types/db";
import { revokeNotifyToken } from "@/lib/server/line-notify";
import {
  handleTestMessageSend,
  startLineLogin,
} from "@/app/settings/notification/actions";

type NotificationTableProps = {
  tokenJson: string;
};

const columns = [
  { name: "送信先", uid: "description" },
  { name: "追加日時", uid: "issued_at" },
  { name: "", uid: "actions" },
];

export default function NotificationTable(props: NotificationTableProps) {
  const [isTableLoading, setIsTableLoading] = React.useState(true);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);
  const [descriptionValue, setDescriptionValue] = React.useState("");
  const [selectedKeys, setSelectedKeys] = React.useState<Selection>(
    new Set([]),
  );

  const notificationList = useAsyncList<LineNotifyToken>({
    async load() {
      setIsTableLoading(false);

      return {
        items: JSON.parse(props.tokenJson) as LineNotifyToken[],
      };
    },
  });

  const handleDeleteNotifications = () => {
    setIsDeleting(true);
  };

  const renderCell = React.useCallback(
    (item: LineNotifyToken, columnKey: React.Key) => {
      switch (columnKey) {
        case "description":
          return item.description;
        case "issued_at":
          const date = new Date(item.issued_at ?? 0);
          console.log(item.issued_at);

          const text = item.token ? date.toLocaleString("ja-JP") : "認証未完了";

          return text;
        case "actions":
          return (
            <form
              action={revokeNotifyToken}
              onSubmit={handleDeleteNotifications}
            >
              <Button
                color="danger"
                isLoading={isDeleting}
                size="sm"
                type="submit"
              >
                削除
              </Button>
              <input name="id" type="hidden" value={item.id} />
            </form>
          );
        default:
          return null;
      }
    },
    [isDeleting, handleDeleteNotifications],
  );

  const isTokenSelected = selectedKeys === "all" || selectedKeys.size > 0;

  const tokenHiddenInputs = React.useMemo(() => {
    if (selectedKeys !== "all") {
      return Array.from(selectedKeys.values()).map((key) => (
        <input key={key} name="id" type="hidden" value={key} />
      ));
    } else if (selectedKeys === "all") {
      return Array.from(notificationList.items).map((item) => (
        <input key={item.id} name="id" type="hidden" value={item.id} />
      ));
    }

    return null;
  }, [selectedKeys, notificationList.items]);

  const handleLineLogin = () => {
    setIsLoggingIn(true);
  };

  const topContent = React.useMemo(() => {
    return (
      <div className="flex w-full grid-cols-1 gap-4 md:grid-cols-4">
        <div className="w-full">
          <form action={startLineLogin} onSubmit={handleLineLogin}>
            <Button
              className="mb-2 w-full"
              color="success"
              isDisabled={isLoggingIn || descriptionValue === ""}
              isLoading={isLoggingIn}
              size="md"
              type="submit"
            >
              LINEでログイン
            </Button>
            <Input
              isRequired
              className="my-2 w-full"
              label="LINEの送信先名"
              name="description"
              placeholder="グループライン"
              onValueChange={setDescriptionValue}
            />
          </form>
        </div>
        <div className="w-full">
          <form action={handleTestMessageSend}>
            <Button
              className="mb-2 w-full"
              color="success"
              isLoading={isLoggingIn}
              size="md"
              type="submit"
            >
              テストメッセージ送信
            </Button>
          </form>
        </div>
        <div className="w-full">
          <form action={revokeNotifyToken} onSubmit={handleDeleteNotifications}>
            <Button
              color="danger"
              isDisabled={!isTokenSelected}
              isLoading={isDeleting}
              size="md"
              type="submit"
            >
              選択した通知設定を削除
            </Button>
            {tokenHiddenInputs}
          </form>
        </div>
      </div>
    );
  }, [
    isTokenSelected,
    isDeleting,
    handleDeleteNotifications,
    tokenHiddenInputs,
  ]);

  return (
    <Card className={cardStyles()} shadow="none">
      <CardBody>
        <Table
          isHeaderSticky
          aria-label="通知設定"
          checkboxesProps={{
            classNames: {
              wrapper: [
                "after:bg-foreground after:text-background text-background",
              ],
            },
          }}
          classNames={{
            wrapper: "max-h-[382px] bg-transparent p-0 border-none shadow-none",
          }}
          selectedKeys={selectedKeys}
          selectionMode="multiple"
          topContent={topContent}
          topContentPlacement="outside"
          onSelectionChange={setSelectedKeys}
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn
                key={column.uid}
                align={column.uid === "actions" ? "center" : "start"}
              >
                {column.name}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody
            emptyContent={"No notifications found"}
            isLoading={isTableLoading}
            items={notificationList.items}
            loadingContent={<Spinner label="ロード中..." />}
          >
            {(item) => (
              <TableRow key={item.id}>
                {(columnKey) => (
                  <TableCell>{renderCell(item, columnKey)}</TableCell>
                )}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardBody>
    </Card>
  );
}
