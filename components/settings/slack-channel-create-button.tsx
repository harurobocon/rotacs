"use client";

import React from "react";
import { Button } from "@heroui/react";
import { useFormState } from "react-dom";

import { createSlackChannelsForAllUsers } from "@/app/settings/users/actions";
import { ActionResult } from "@/types/actions";

const initialState: ActionResult = {};

export default function SlackChannelCreateButton() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [showDetails, setShowDetails] = React.useState(false);
  const [state, formAction] = useFormState(
    createSlackChannelsForAllUsers,
    initialState,
  );

  React.useEffect(() => {
    setIsLoading(false);
  }, [state]);

  return (
    <div className="space-y-4">
      <form action={formAction} onSubmit={() => setIsLoading(true)}>
        <Button
          className="mb-2"
          color="primary"
          isLoading={isLoading}
          type="submit"
        >
          全ユーザーのSlackチャンネルを作成
        </Button>
      </form>

      {state?.success && (
        <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800">
          <div className="font-medium">✅ 処理完了</div>
          <div className="mt-1">{state.success}</div>
        </div>
      )}

      {state?.errors && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
          <div className="font-medium">❌ エラーが発生しました</div>
          <div className="mt-1 whitespace-pre-line">{state.errors}</div>
          {state.errors.includes("\n") && (
            <button
              className="mt-2 text-xs underline"
              type="button"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? "詳細を隠す" : "詳細を表示"}
            </button>
          )}
          {showDetails && state.errors.includes("\n") && (
            <div className="mt-2 rounded bg-red-100 p-2 text-xs">
              <pre className="whitespace-pre-wrap">{state.errors}</pre>
            </div>
          )}
        </div>
      )}

      {state?.success && state?.errors && (
        <div className="rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800">
          <div className="font-medium">
            ⚠️ 一部のユーザーで問題が発生しました
          </div>
          <div className="mt-1">
            処理は完了しましたが、一部のユーザーでチャンネルの作成に失敗しました。
          </div>
        </div>
      )}
    </div>
  );
}
