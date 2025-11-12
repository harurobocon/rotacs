"use client";

import React from "react";
import { Button, Checkbox, CheckboxGroup } from "@heroui/react";
import { useFormState } from "react-dom";

import {
  deleteSlackChannelsForAllUsers,
  getTeamChannels,
} from "@/app/settings/users/actions";
import { ActionResult } from "@/types/actions";
import {
  getCheckLocationSettings,
  listenCheckLocationSettings,
} from "@/lib/client/settings";

const initialState: ActionResult = {};

// チームチャンネル情報の型
type TeamChannel = {
  name: string;
  displayName: string;
};

export default function SlackChannelDeleteButton() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [showDetails, setShowDetails] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [excludedChannels, setExcludedChannels] = React.useState<string[]>([]);
  const [systemChannels, setSystemChannels] = React.useState<
    Array<{ name: string; description: string }>
  >([]);
  const [teamChannels, setTeamChannels] = React.useState<TeamChannel[]>([]);
  const formRef = React.useRef<HTMLFormElement>(null);
  const [state, formAction] = useFormState(
    deleteSlackChannelsForAllUsers,
    initialState,
  );

  React.useEffect(() => {
    setIsLoading(false);
    setShowConfirm(false);
  }, [state]);

  // チームチャンネル一覧を取得
  React.useEffect(() => {
    getTeamChannels().then(setTeamChannels);
  }, []);

  // モード設定に応じてシステムチャンネルリストを動的に生成
  React.useEffect(() => {
    const updateSystemChannels = (settings: any) => {
      const channels: Array<{ name: string; description: string }> = [];

      // 計量計測1のモードに応じて
      if (settings.check1 === "dual") {
        channels.push(
          {
            name: "00_西_計量計測1",
            description: "計量計測1（西）の予約通知用",
          },
          {
            name: "00_東_計量計測1",
            description: "計量計測1（東）の予約通知用",
          },
        );
      } else {
        channels.push({
          name: "00_計量計測1",
          description: "計量計測1の予約通知用",
        });
      }

      // 計量計測2のモードに応じて
      if (settings.check2 === "dual") {
        channels.push(
          {
            name: "00_西_計量計測2",
            description: "計量計測2（西）の予約通知用",
          },
          {
            name: "00_東_計量計測2",
            description: "計量計測2（東）の予約通知用",
          },
        );
      } else {
        channels.push({
          name: "00_計量計測2",
          description: "計量計測2の予約通知用",
        });
      }

      // テストランチャンネルを追加
      channels.push(
        { name: "00_赤テストラン", description: "赤テストランの予約通知用" },
        { name: "00_青テストラン", description: "青テストランの予約通知用" },
      );

      setSystemChannels(channels);
    };

    // 初期読み込み
    getCheckLocationSettings().then(updateSystemChannels);

    // モード設定の変更をリスニング
    const unsubscribe = listenCheckLocationSettings(updateSystemChannels);

    return () => {
      unsubscribe();
    };
  }, []);

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

  // チームチャンネルの一括選択/解除
  const handleTeamChannelsToggle = (checked: boolean) => {
    const teamChannelNames = teamChannels.map((t) => t.name);

    if (checked) {
      // すべてのチームチャンネルを追加
      setExcludedChannels((prev) => [
        ...prev.filter((ch) => !teamChannelNames.includes(ch)),
        ...teamChannelNames,
      ]);
    } else {
      // すべてのチームチャンネルを削除
      setExcludedChannels((prev) =>
        prev.filter((ch) => !teamChannelNames.includes(ch)),
      );
    }
  };

  // チームチャンネルがすべて選択されているか
  const allTeamChannelsSelected =
    teamChannels.length > 0 &&
    teamChannels.every((t) => excludedChannels.includes(t.name));

  // チームチャンネルが一部選択されているか
  const someTeamChannelsSelected =
    teamChannels.some((t) => excludedChannels.includes(t.name)) &&
    !allTeamChannelsSelected;

  return (
    <div className="space-y-4">
      <form ref={formRef} action={formAction} onSubmit={handleSubmit}>
        {/* 除外するチャンネルの選択 */}
        <div className="mb-4">
          <p className="mb-2 text-sm font-medium">
            削除から除外するチャンネル:
          </p>
          <div className="space-y-3">
            {/* システムチャンネル */}
            <div>
              <p className="mb-1 text-xs font-semibold text-gray-600">
                システムチャンネル
              </p>
              <CheckboxGroup
                value={excludedChannels}
                onValueChange={setExcludedChannels}
              >
                {systemChannels.map((channel) => (
                  <Checkbox
                    key={channel.name}
                    name="exclude"
                    value={channel.name}
                    className="ml-4"
                  >
                    {channel.name} ({channel.description})
                  </Checkbox>
                ))}
              </CheckboxGroup>
            </div>

            {/* チームチャンネル */}
            <div>
              <Checkbox
                isSelected={allTeamChannelsSelected}
                isIndeterminate={someTeamChannelsSelected}
                onValueChange={handleTeamChannelsToggle}
              >
                <span className="text-xs font-semibold text-gray-600">
                  チームチャンネル
                </span>
              </Checkbox>
              <CheckboxGroup
                value={excludedChannels}
                onValueChange={setExcludedChannels}
                className="ml-4 mt-1"
              >
                {teamChannels.map((team) => (
                  <Checkbox key={team.name} name="exclude" value={team.name}>
                    {team.name}
                  </Checkbox>
                ))}
              </CheckboxGroup>
            </div>
          </div>
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
