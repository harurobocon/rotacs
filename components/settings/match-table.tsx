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
import { MatchData } from "@/types/match";

interface MatchTableProps {
  matches: MatchData[];
}

export default function MatchSettingsTable({ matches }: MatchTableProps) {
  const getStatusChip = (status: MatchData["status"]) => {
    switch (status) {
      case "in_progress":
        return <Chip color="success" size="sm" variant="solid">進行中</Chip>;
      case "moving":
        return <Chip color="warning" size="sm" variant="flat">移動中</Chip>;
      case "preparing":
        return <Chip color="secondary" size="sm" variant="flat">準備中</Chip>;
      case "completed":
        return <Chip color="default" size="sm" variant="flat">終了</Chip>;
      default:
        return <Chip color="primary" size="sm" variant="flat">予定</Chip>;
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
    <div className="mt-4">
      <Table aria-label="登録済み試合一覧">
        <TableHeader>
          <TableColumn>順序</TableColumn>
          <TableColumn>試合ID</TableColumn>
          <TableColumn>赤コーナー (RED)</TableColumn>
          <TableColumn>青コーナー (BLUE)</TableColumn>
          <TableColumn>スコア (赤 - 青)</TableColumn>
          <TableColumn>ステータス</TableColumn>
        </TableHeader>
        <TableBody>
          {matches.map((m) => (
            <TableRow key={m.id}>
              <TableCell className="font-bold">#{m.match_index}</TableCell>
              <TableCell className="font-mono text-xs">{m.match_id}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-semibold text-danger">
                    {m.team_red?.display_name || `-`}
                  </span>
                  <span className="text-xs text-default-400">
                    {m.team_red?.team_name}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-semibold text-primary">
                    {m.team_blue?.display_name || `-`}
                  </span>
                  <span className="text-xs text-default-400">
                    {m.team_blue?.team_name}
                  </span>
                </div>
              </TableCell>
              <TableCell className="font-mono">
                {m.score_red ?? 0} - {m.score_blue ?? 0}
              </TableCell>
              <TableCell>{getStatusChip(m.status)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
