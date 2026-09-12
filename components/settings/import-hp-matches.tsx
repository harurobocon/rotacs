"use client";

import {
  Card,
  CardBody,
  Input,
  Button,
  Spacer,
} from "@heroui/react";
import React from "react";
import { useFormState } from "react-dom";

import { ActionResult } from "@/types/actions";
import { importMatchesFromHomepageAction } from "@/app/settings/match/actions";
import { cn } from "@/lib/cn";

interface ImportHpMatchesProps {
  className?: string;
}

const initialImportState: ActionResult = {};

export default function ImportHpMatches(props: ImportHpMatchesProps) {
  const [importState, importDispatch] = useFormState(
    importMatchesFromHomepageAction,
    initialImportState,
  );
  const [isLoading, setIsLoading] = React.useState(false);

  const onSubmit = () => {
    setIsLoading(true);
  };

  React.useEffect(() => {
    setIsLoading(false);
  }, [importState]);

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
          Homepage API から試合対戦表を取得・同期
        </p>
        <p className="text-xs font-normal text-default-400">
          Homepageで登録・作成された対戦表データを取得し、RoTACSの試合管理データベース(Firestore)に一括同期します。
        </p>
        <Spacer y={2} />
        <form action={importDispatch} onSubmit={onSubmit}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Input
              className="flex-1"
              defaultValue="http://localhost:8000/staff/matches/api/list/"
              isDisabled={isLoading}
              label="Homepage 試合 API URL"
              name="apiUrl"
              placeholder="http://localhost:8000/staff/matches/api/list/"
              size="sm"
            />
            <Button color="primary" isLoading={isLoading} type="submit">
              HPから対戦表を取り込み
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
      </CardBody>
    </Card>
  );
}
