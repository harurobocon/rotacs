"use client";

import React from "react";
import { Card, CardHeader, CardBody, Chip } from "@heroui/react";
import { Icon } from "@iconify/react";

export interface WaitingItem {
  id: string;
  pitNumber: number | null;
  teamName: string;
  count: number;
  time?: string | null;
  side?: string;
  status: string;
}

export interface WaitingCardLane {
  laneName?: string;
  calling: WaitingItem[];
  next: WaitingItem[];
  inProgress?: WaitingItem[];
}

export interface WaitingCardProps {
  title: string;
  subtitle?: string;
  icon: string;
  colorTheme: "emerald" | "teal" | "rose" | "blue" | "amber";
  lanes: WaitingCardLane[];
  totalWaitingCount: number;
}

const themeStyles = {
  emerald: {
    border: "border-emerald-600",
    headerBg: "bg-emerald-700 text-white",
    headerIconBg: "bg-white/20 text-white",
    badgeColor: "success" as const,
    callingBg: "bg-red-50 border-2 border-red-500",
    inProgressBg: "bg-emerald-50 border-2 border-emerald-500",
  },
  teal: {
    border: "border-teal-600",
    headerBg: "bg-teal-700 text-white",
    headerIconBg: "bg-white/20 text-white",
    badgeColor: "primary" as const,
    callingBg: "bg-red-50 border-2 border-red-500",
    inProgressBg: "bg-teal-50 border-2 border-teal-500",
  },
  rose: {
    border: "border-rose-600",
    headerBg: "bg-rose-700 text-white",
    headerIconBg: "bg-white/20 text-white",
    badgeColor: "danger" as const,
    callingBg: "bg-red-50 border-2 border-red-500",
    inProgressBg: "bg-rose-50 border-2 border-rose-500",
  },
  blue: {
    border: "border-blue-600",
    headerBg: "bg-blue-700 text-white",
    headerIconBg: "bg-white/20 text-white",
    badgeColor: "primary" as const,
    callingBg: "bg-red-50 border-2 border-red-500",
    inProgressBg: "bg-blue-50 border-2 border-blue-500",
  },
  amber: {
    border: "border-amber-600",
    headerBg: "bg-amber-500 text-slate-950",
    headerIconBg: "bg-slate-950/10 text-slate-950",
    badgeColor: "warning" as const,
    callingBg: "bg-red-50 border-2 border-red-500",
    inProgressBg: "bg-amber-50 border-2 border-amber-500",
  },
};

export function WaitingCard({
  title,
  icon,
  colorTheme,
  lanes,
  totalWaitingCount,
}: WaitingCardProps) {
  const theme = themeStyles[colorTheme];
  const isDual = lanes.length > 1;

  return (
    <Card
      className={`flex h-full flex-col border-2 bg-white shadow-md ${theme.border}`}
    >
      {/* Card Header */}
      <CardHeader
        className={`flex items-center justify-between px-4 py-3 ${theme.headerBg}`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold ${theme.headerIconBg}`}
          >
            <Icon className="text-2xl" icon={icon} />
          </div>
          <h2 className="text-2xl font-black tracking-tight lg:text-3xl">
            {title}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {totalWaitingCount > 0 ? (
            <Chip
              className="font-black text-white shadow-sm"
              color={theme.badgeColor}
              size="md"
              variant="solid"
            >
              待機 {totalWaitingCount}組
            </Chip>
          ) : (
            <Chip
              className="font-bold text-slate-700"
              color="default"
              size="md"
              variant="flat"
            >
              待機なし
            </Chip>
          )}
        </div>
      </CardHeader>

      {/* Card Body */}
      <CardBody className="flex flex-1 flex-col gap-4 p-3 lg:p-4">
        {lanes.map((lane, idx) => {
          const currentRunning = lane.inProgress?.[0];
          const hasCalling = lane.calling.length > 0;
          const next1 = lane.next[0];
          const next2 = lane.next[1];

          return (
            <div
              key={lane.laneName ?? idx}
              className={`flex flex-1 flex-col gap-3 ${
                isDual
                  ? "rounded-xl border-2 border-slate-300 bg-slate-50 p-2.5"
                  : ""
              }`}
            >
              {lane.laneName && (
                <div className="flex items-center justify-between border-b-2 border-slate-200 pb-1.5">
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-sm font-black text-white">
                    {lane.laneName}レーン
                  </span>
                  {hasCalling && (
                    <span className="animate-pulse text-xs font-black text-red-600">
                      呼出中あり
                    </span>
                  )}
                </div>
              )}

              {/* 1. 実施中 (In Progress Section) */}
              <div
                className={`rounded-xl p-2.5 ${
                  currentRunning
                    ? theme.inProgressBg
                    : "border border-slate-200 bg-slate-50"
                }`}
              >
                <div className="mb-1 flex items-center gap-1.5">
                  <Icon
                    className={`text-base ${
                      currentRunning ? "text-slate-900" : "text-slate-400"
                    }`}
                    icon="solar:play-circle-bold"
                  />
                  <span
                    className={`text-xs font-black tracking-wider ${
                      currentRunning ? "text-slate-900" : "text-slate-400"
                    }`}
                  >
                    実施中
                  </span>
                </div>

                {currentRunning ? (
                  <div className="flex items-baseline justify-between gap-2 rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
                    <span className="text-2xl font-black text-slate-950 lg:text-3xl">
                      {currentRunning.pitNumber && currentRunning.pitNumber > 0
                        ? `Pit ${currentRunning.pitNumber}`
                        : "Pit -"}
                    </span>
                    <span className="truncate text-base font-black text-slate-900 lg:text-lg">
                      {currentRunning.teamName}
                    </span>
                  </div>
                ) : (
                  <div className="py-1 text-center text-xs font-bold text-slate-400">
                    実施中のチームはありません
                  </div>
                )}
              </div>

              {/* 2. お呼び出し中 (Calling Section) */}
              <div
                className={`rounded-xl p-2.5 ${
                  hasCalling
                    ? theme.callingBg
                    : "border border-slate-200 bg-slate-50"
                }`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Icon
                      className={`text-lg ${
                        hasCalling
                          ? "animate-bounce text-red-600"
                          : "text-slate-400"
                      }`}
                      icon="solar:volume-loud-bold"
                    />
                    <span
                      className={`text-xs font-black tracking-wide ${
                        hasCalling ? "text-red-600" : "text-slate-400"
                      }`}
                    >
                      お呼び出し中
                    </span>
                  </div>
                  {hasCalling && (
                    <span className="animate-pulse rounded bg-red-600 px-2 py-0.5 text-[11px] font-black text-white">
                      呼出中
                    </span>
                  )}
                </div>

                {hasCalling ? (
                  <div className="flex flex-col gap-2">
                    {lane.calling.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col rounded-lg border border-red-300 bg-white p-2.5 shadow-sm"
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-3xl font-black text-red-950 lg:text-4xl">
                            {item.pitNumber && item.pitNumber > 0
                              ? `Pit ${item.pitNumber}`
                              : "Pit -"}
                          </span>
                          {item.count > 0 && (
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                              {item.count}回目
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 truncate text-lg font-black text-slate-900 lg:text-xl">
                          {item.teamName}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-1 text-center text-xs font-bold text-slate-400">
                    呼び出し中のチームはありません
                  </div>
                )}
              </div>

              {/* 3. 順番待ち（次に呼ばれる ＆ 次の次に呼ばれる） */}
              <div className="flex flex-1 flex-col gap-2 rounded-xl border-2 border-slate-300 bg-white p-2.5">
                <div className="flex items-center gap-1.5">
                  <Icon
                    className="text-base text-slate-700"
                    icon="solar:clock-circle-bold"
                  />
                  <span className="text-xs font-black tracking-wider text-slate-800">
                    順番待ち
                  </span>
                </div>

                {next1 || next2 ? (
                  <div className="flex flex-1 flex-col gap-2">
                    {/* 1番目のチーム (次に呼ばれるチーム) */}
                    {next1 && (
                      <div className="flex flex-col rounded-lg border-2 border-slate-400 bg-slate-50 p-2.5 shadow-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-2xl font-black text-slate-950 lg:text-3xl">
                            {next1.pitNumber && next1.pitNumber > 0
                              ? `Pit ${next1.pitNumber}`
                              : "Pit -"}
                          </span>
                          <span className="rounded bg-slate-900 px-2 py-0.5 text-xs font-black text-white">
                            次（1番目）
                          </span>
                        </div>
                        <div className="mt-1 truncate text-lg font-black text-slate-900 lg:text-xl">
                          {next1.teamName}
                        </div>
                      </div>
                    )}

                    {/* 2番目のチーム (次の次に呼ばれるチーム) */}
                    {next2 && (
                      <div className="flex flex-col rounded-lg border-2 border-slate-400 bg-slate-50 p-2.5 shadow-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-2xl font-black text-slate-950 lg:text-3xl">
                            {next2.pitNumber && next2.pitNumber > 0
                              ? `Pit ${next2.pitNumber}`
                              : "Pit -"}
                          </span>
                          <span className="rounded bg-slate-700 px-2 py-0.5 text-xs font-black text-white">
                            次々（2番目）
                          </span>
                        </div>
                        <div className="mt-1 truncate text-lg font-black text-slate-900 lg:text-xl">
                          {next2.teamName}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-1 items-center justify-center py-4 text-center text-xs font-bold text-slate-400">
                    待ちチームはありません
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </CardBody>
    </Card>
  );
}
