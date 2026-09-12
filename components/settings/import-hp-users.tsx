"use client";

import {
  Card,
  CardBody,
  Input,
  Button,
  Spacer,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/react";
import React from "react";
import { useFormState } from "react-dom";

import { ActionResult } from "@/types/actions";
import { importUsersFromHomepage } from "@/app/settings/users/actions";
import { cn } from "@/lib/cn";

interface ImportHpUsersProps {
  className?: string;
}

const initialImportUsersState: ActionResult = {};

const ImportHpUsers: React.FC<ImportHpUsersProps> = (props) => {
  const [importState, importDispatch] = useFormState(
    importUsersFromHomepage,
    initialImportUsersState,
  );
  const [isLoading, setIsLoading] = React.useState(false);

  const onSubmit = () => {
    setIsLoading(true);
  };

  React.useEffect(() => {
    setIsLoading(false);
  }, [importState]);

  const createdUsers = importState.createdUsers;

  return (
    <Card
      className={cn(
        "mt-4 border border-default-200 bg-transparent",
        props.className,
      )}
      shadow="none"
    >
      <CardBody>
        <p className="text-sm font-semibold text-default-700">
          Homepage API からチーム情報を取得して登録
        </p>
        <p className="text-xs font-normal text-default-400">
          Homepageで登録されたチーム一覧を取得し、初期パスワードを自動生成して一括登録します。
        </p>
        <Spacer y={2} />
        <form action={importDispatch} onSubmit={onSubmit}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Input
              className="flex-1"
              defaultValue="http://localhost:8000/api/teams/"
              isDisabled={isLoading}
              label="Homepage API URL"
              name="apiUrl"
              placeholder="http://localhost:8000/api/teams/"
              size="sm"
            />
            <Button color="primary" isLoading={isLoading} type="submit">
              HPからチーム情報を登録
            </Button>
          </div>
        </form>

        {importState.errors ? (
          <div className="mt-3 rounded-medium bg-danger-50 p-3 text-xs text-danger">
            <p className="whitespace-pre-wrap font-medium">
              {importState.errors}
            </p>
          </div>
        ) : null}

        {importState.success ? (
          <div className="mt-3 rounded-medium bg-success-50 p-3 text-xs text-success-700">
            <p className="font-medium">{importState.success}</p>
          </div>
        ) : null}

        {createdUsers && createdUsers.length > 0 ? (
          <div className="mt-4 flex flex-col gap-2">
            <p className="text-xs font-bold text-default-600">
              新規作成されたユーザーアカウント（初期パスワード）:
            </p>
            <Table aria-label="新規作成されたユーザー">
              <TableHeader>
                <TableColumn>ユーザー名</TableColumn>
                <TableColumn>表示名</TableColumn>
                <TableColumn>自動生成初期パスワード</TableColumn>
                <TableColumn>ピット</TableColumn>
              </TableHeader>
              <TableBody>
                {createdUsers.map((user) => (
                  <TableRow key={user.username}>
                    <TableCell className="font-mono text-xs">
                      {user.username}
                    </TableCell>
                    <TableCell>{user.display_name}</TableCell>
                    <TableCell className="font-mono text-xs font-bold text-primary">
                      {user.password}
                    </TableCell>
                    <TableCell className="text-xs">
                      {user.pit_side}{" "}
                      {user.pit_number > 0 ? `(${user.pit_number})` : ""}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
};

ImportHpUsers.displayName = "ImportHpUsers";

export default ImportHpUsers;
