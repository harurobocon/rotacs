"use client";

import React from "react";
import { Button, Checkbox, CheckboxGroup } from "@heroui/react";
import { useFormState } from "react-dom";

import { deleteSlackChannelsForAllUsers } from "@/app/settings/users/actions";
import { ActionResult } from "@/types/actions";

const initialState: ActionResult = {};

// システムチャンネルのリスト（クライアントサイドで使用）
const SYSTEM_CHANNEL_LIST = [
  { name: "00_計量計測", description: "計量計測の予約通知用" },
  { name: "00_赤テストラン", description: "赤テストランの予約通知用" },
  { name: "00_青テストラン", description: "青テストランの予約通知用" },
];

export default function SlackChannelDeleteButton() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [showDetails, setShowDetails] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [excludedChannels, setExcludedChannels] = React.useState<string[]>([]);
  const formRef = React.useRef<HTMLFormElement>(null);
  const [state, formAction] = useFormState(
    deleteSlackChannelsForAllUsers,
    initialState,
  );

  React.useEffect(() => {
    setIsLoading(false);
    setShowConfirm(false);
  }, [state]);

  const handleSubmit = (e: React.FormEvent) => {
    if (!showConfirm) {
      e.preventDefault();
      setShowConfirm(true);

      return;
    }

    setIsLoading(true);
  };

  const handleConfirmDelete = () => {
    setIsLoading(true);
    // フォームを送信
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  };

  return (
    <div className="space-y-4">
      <form ref={formRef} action={formAction} onSubmit={handleSubmit}>
        {/* 除外するチャンネルの選択 */}
        <div className="mb-4">
          <p className="mb-2 text-sm font-medium">
            削除から除外するチャンネル:
          </p>
          <CheckboxGroup
            value={excludedChannels}
            onValueChange={setExcludedChannels}
          >
            {SYSTEM_CHANNEL_LIST.map((channel) => (
              <Checkbox key={channel.name} name="exclude" value={channel.name}>
                {channel.name} ({channel.description})
              </Checkbox>
            ))}
          </CheckboxGroup>
        </div>

        <Button
          className="mb-2"
          color="danger"
          isLoading={isLoading}
          type="submit"
        >
          全ユーザーのSlackチャンネルを削除
        </Button>
        {showConfirm && !isLoading && (
          <div className="mt-2 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
            <p className="font-medium">⚠️ 本当に削除しますか？</p>
            <p className="mt-1 text-xs">
              &quot;NN_&quot;で始まる全てのチャンネルをアーカイブし、リネームします。
              <br />
              これにより同じ名前で新規チャンネルを作成できるようになります。
            </p>
            {excludedChannels.length > 0 && (
              <p className="mt-1 text-xs">
                除外されるチャンネル: {excludedChannels.join(", ")}
              </p>
            )}
            <div className="mt-2 flex gap-2">
              <Button color="danger" size="sm" onPress={handleConfirmDelete}>
                削除する
              </Button>
              <Button
                size="sm"
                variant="flat"
                onPress={() => setShowConfirm(false)}
              >
                キャンセル
              </Button>
            </div>
          </div>
        )}
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
            ⚠️ 一部のチャンネルで問題が発生しました
          </div>
          <div className="mt-1">
            処理は完了しましたが、一部のチャンネルの削除に失敗しました。
          </div>
        </div>
      )}
    </div>
  );
}
