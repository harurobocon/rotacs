"use client";

import React from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
} from "@heroui/react";

import { Select, SelectItem } from "@heroui/react";
import { MatchData, getMatchTeamDisplay } from "@/types/match";
import { updateMatchStatusAction } from "@/app/settings/match/actions";

interface MatchTableProps {
  matches: MatchData[];
}

export default function MatchSettingsTable({ matches }: MatchTableProps) {
  const [localMatches, setLocalMatches] = React.useState<MatchData[]>(matches);
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    setLocalMatches(matches);
  }, [matches]);

  const handleStatusChange = async (matchId: string, newStatus: string) => {
    if (!newStatus) return;
    setUpdatingId(matchId);
    setStatusMessage(null);

    setLocalMatches((prev) =>
      prev.map((m) =>
        m.id === matchId
          ? { ...m, status: newStatus as MatchData["status"] }
          : m,
      ),
    );

    const res = await updateMatchStatusAction(matchId, newStatus);
    setUpdatingId(null);

    if (res.ok) {
      setStatusMessage(`試合 [${matchId}] の状態を「${newStatus}」に保存しました。`);
      setTimeout(() => setStatusMessage(null), 4000);
    } else {
      alert(`状態の保存に失敗しました: ${res.error}`);
    }
  };

  if (matches.length === 0) {
    return (
      <div className="mt-4 rounded-medium border border-dashed border-default-300 p-6 text-center text-sm text-default-500">
        登録されている試合スケジュールはありません。上のフォームからHomepageの対戦表を取り込んでください。
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-2">
      {statusMessage ? (
        <div className="rounded-medium bg-success-50 p-2.5 text-xs font-bold text-success-700 shadow-sm transition-all">
          {statusMessage}
        </div>
      ) : null}

      <Table aria-label="登録済み試合一覧">
        <TableHeader>
          <TableColumn>順序</TableColumn>
          <TableColumn>試合ID</TableColumn>
          <TableColumn>赤コーナー (RED)</TableColumn>
          <TableColumn>青コーナー (BLUE)</TableColumn>
          <TableColumn>スコア (赤 - 青)</TableColumn>
          <TableColumn>ステータス（状態設定）</TableColumn>
        </TableHeader>
        <TableBody>
          {localMatches.map((m) => (
            <TableRow key={m.id}>
              <TableCell className="font-bold">
                #{m.match_no ?? m.match_index}
              </TableCell>
              <TableCell className="font-mono text-xs">{m.match_id}</TableCell>
              <TableCell>
                {(() => {
                  const { primary, secondary } = getMatchTeamDisplay(
                    m.team_red,
                  );

                  return (
                    <div className="flex flex-col">
                      <span className="font-semibold text-danger">
                        {primary}
                      </span>
                      {secondary ? (
                        <span className="text-xs text-default-400">
                          {secondary}
                        </span>
                      ) : null}
                    </div>
                  );
                })()}
              </TableCell>
              <TableCell>
                {(() => {
                  const { primary, secondary } = getMatchTeamDisplay(
                    m.team_blue,
                  );

                  return (
                    <div className="flex flex-col">
                      <span className="font-semibold text-primary">
                        {primary}
                      </span>
                      {secondary ? (
                        <span className="text-xs text-default-400">
                          {secondary}
                        </span>
                      ) : null}
                    </div>
                  );
                })()}
              </TableCell>
              <TableCell className="font-mono">
                {m.score_red ?? 0} - {m.score_blue ?? 0}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Select
                    aria-label={`試合${m.match_id}のステータス変更`}
                    className="min-w-28"
                    isDisabled={updatingId === m.id}
                    selectedKeys={[m.status || "scheduled"]}
                    size="sm"
                    variant="bordered"
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0];
                      if (selected) {
                        handleStatusChange(m.id, String(selected));
                      }
                    }}
                  >
                    <SelectItem key="scheduled">
                      予定
                    </SelectItem>
                    <SelectItem key="preparing">
                      準備中
                    </SelectItem>
                    <SelectItem key="moving">
                      移動中
                    </SelectItem>
                    <SelectItem key="in_progress">
                      進行中
                    </SelectItem>
                    <SelectItem key="completed">
                      終了
                    </SelectItem>
                  </Select>
                  {updatingId === m.id ? (
                    <span className="text-xs font-medium text-default-400">保存中...</span>
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
