"use client";

import React from "react";
import { Card, CardHeader, CardBody, CardFooter, Chip } from "@heroui/react";
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
    border: "border-emerald-500/40",
    headerBg: "bg-emerald-950/40 text-emerald-400",
    accentBg: "bg-emerald-500/10",
    accentText: "text-emerald-400",
    badgeColor: "success" as const,
    glow: "shadow-[0_0_20px_rgba(16,185,129,0.15)]",
    callingBorder:
      "border-emerald-400 bg-emerald-950/60 shadow-[0_0_24px_rgba(16,185,129,0.25)]",
  },
  teal: {
    border: "border-teal-500/40",
    headerBg: "bg-teal-950/40 text-teal-400",
    accentBg: "bg-teal-500/10",
    accentText: "text-teal-400",
    badgeColor: "primary" as const,
    glow: "shadow-[0_0_20px_rgba(20,184,166,0.15)]",
    callingBorder:
      "border-teal-400 bg-teal-950/60 shadow-[0_0_24px_rgba(20,184,166,0.25)]",
  },
  rose: {
    border: "border-rose-500/40",
    headerBg: "bg-rose-950/40 text-rose-400",
    accentBg: "bg-rose-500/10",
    accentText: "text-rose-400",
    badgeColor: "danger" as const,
    glow: "shadow-[0_0_20px_rgba(244,63,94,0.15)]",
    callingBorder:
      "border-rose-400 bg-rose-950/60 shadow-[0_0_24px_rgba(244,63,94,0.25)]",
  },
  blue: {
    border: "border-sky-500/40",
    headerBg: "bg-sky-950/40 text-sky-400",
    accentBg: "bg-sky-500/10",
    accentText: "text-sky-400",
    badgeColor: "primary" as const,
    glow: "shadow-[0_0_20px_rgba(14,165,233,0.15)]",
    callingBorder:
      "border-sky-400 bg-sky-950/60 shadow-[0_0_24px_rgba(14,165,233,0.25)]",
  },
  amber: {
    border: "border-amber-500/40",
    headerBg: "bg-amber-950/40 text-amber-400",
    accentBg: "bg-amber-500/10",
    accentText: "text-amber-400",
    badgeColor: "warning" as const,
    glow: "shadow-[0_0_20px_rgba(245,158,11,0.15)]",
    callingBorder:
      "border-amber-400 bg-amber-950/60 shadow-[0_0_24px_rgba(245,158,11,0.25)]",
  },
};

export function WaitingCard({
  title,
  subtitle,
  icon,
  colorTheme,
  lanes,
  totalWaitingCount,
}: WaitingCardProps) {
  const theme = themeStyles[colorTheme];
  const isDual = lanes.length > 1;

  return (
    <Card
      className={`flex h-full flex-col border bg-content1/80 backdrop-blur-md transition-all duration-300 ${theme.border} ${theme.glow}`}
    >
      {/* Card Header */}
      <CardHeader
        className={`flex items-center justify-between border-b border-divider/60 px-4 py-3 ${theme.headerBg}`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl bg-background/60 shadow-sm ${theme.accentText}`}
          >
            <Icon className="text-2xl" icon={icon} />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-foreground lg:text-2xl">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs font-semibold text-default-400">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {totalWaitingCount > 0 ? (
            <Chip
              className="font-bold shadow-sm"
              color={theme.badgeColor}
              size="md"
              variant="flat"
            >
              待機 {totalWaitingCount}組
            </Chip>
          ) : (
            <Chip
              className="font-semibold text-default-400"
              color="default"
              size="md"
              variant="flat"
            >
              待機なし
            </Chip>
          )}
        </div>
      </CardHeader>

      {/* Card Body with Lanes */}
      <CardBody className="flex flex-1 flex-col gap-4 p-3 lg:p-4">
        {lanes.map((lane, idx) => {
          const hasCalling = lane.calling.length > 0;
          const nextTeam = lane.next[0];
          const subsequentTeams = lane.next.slice(1);
          const currentRunning = lane.inProgress?.[0];

          return (
            <div
              key={lane.laneName ?? idx}
              className={`flex flex-1 flex-col gap-3.5 ${
                isDual
                  ? "rounded-xl border border-divider/40 bg-content2/30 p-2.5"
                  : ""
              }`}
            >
              {lane.laneName && (
                <div className="flex items-center gap-2 border-b border-divider/50 pb-1.5">
                  <Chip
                    className="font-black"
                    color={lane.laneName === "西" ? "success" : "warning"}
                    size="sm"
                    variant="solid"
                  >
                    {lane.laneName}レーン
                  </Chip>
                  {lane.calling.length > 0 && (
                    <span className="animate-pulse text-xs font-bold text-danger-500">
                      呼出中あり
                    </span>
                  )}
                </div>
              )}

              {/* 1. お呼び出し中 (Calling Section) */}
              <div
                className={`relative flex flex-col rounded-xl border-2 p-3 transition-all duration-300 ${
                  hasCalling
                    ? `${theme.callingBorder} ring-2 ring-primary/20`
                    : "border-dashed border-default-200 bg-content2/20 dark:border-default-100"
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Icon
                      className={`text-lg ${
                        hasCalling
                          ? "animate-bounce text-danger-500"
                          : "text-default-400"
                      }`}
                      icon="solar:volume-loud-bold"
                    />
                    <span
                      className={`text-sm font-black tracking-wide ${
                        hasCalling ? "text-danger-500" : "text-default-400"
                      }`}
                    >
                      お呼び出し中
                    </span>
                  </div>
                  {hasCalling && (
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger-400 opacity-75" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-danger-500" />
                    </span>
                  )}
                </div>

                {hasCalling ? (
                  <div className="flex flex-col gap-2.5">
                    {lane.calling.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col rounded-lg bg-background/80 p-2.5 shadow-sm"
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-3xl font-black tracking-tight text-foreground lg:text-4xl">
                            {item.pitNumber && item.pitNumber > 0
                              ? `Pit ${item.pitNumber}`
                              : "Pit -"}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {item.count > 0 && (
                              <Chip
                                className="font-bold"
                                color="default"
                                size="sm"
                                variant="flat"
                              >
                                {item.count}回目
                              </Chip>
                            )}
                            {item.time && (
                              <span className="text-xs font-bold text-default-400">
                                {item.time}呼出
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="mt-1 truncate text-lg font-bold text-default-800 lg:text-xl">
                          {item.teamName}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex min-h-[5rem] flex-col items-center justify-center py-2 text-center text-default-400">
                    {currentRunning ? (
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-xs font-semibold text-primary">
                          現在【{currentRunning.status}】
                        </span>
                        <span className="text-sm font-bold text-foreground">
                          {currentRunning.pitNumber
                            ? `Pit ${currentRunning.pitNumber} `
                            : ""}
                          {currentRunning.teamName}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm font-semibold text-default-400">
                        現在お呼び出しはありません
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* 2. 次にお呼びするチーム (Next Called Team) */}
              <div className="flex flex-1 flex-col rounded-xl border border-divider/60 bg-content2/40 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Icon
                      className="text-base text-default-500"
                      icon="solar:clock-circle-bold"
                    />
                    <span className="text-xs font-black tracking-wider text-default-500">
                      次にお呼びするチーム
                    </span>
                  </div>
                  {nextTeam && (
                    <span className="rounded bg-primary-500/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                      準備待機
                    </span>
                  )}
                </div>

                {nextTeam ? (
                  <div className="flex flex-col rounded-lg bg-background/60 p-2.5 shadow-sm">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-2xl font-black tracking-tight text-foreground lg:text-3xl">
                        {nextTeam.pitNumber && nextTeam.pitNumber > 0
                          ? `Pit ${nextTeam.pitNumber}`
                          : "Pit -"}
                      </span>
                      {nextTeam.count > 0 && (
                        <Chip
                          className="font-bold text-default-600"
                          color="default"
                          size="sm"
                          variant="flat"
                        >
                          {nextTeam.count}回目
                        </Chip>
                      )}
                    </div>
                    <div className="mt-0.5 truncate text-base font-bold text-default-800 lg:text-lg">
                      {nextTeam.teamName}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-1 items-center justify-center py-3 text-center text-xs font-medium text-default-400">
                    待ちチームはありません
                  </div>
                )}

                {/* 後続チームのサマリー */}
                {subsequentTeams.length > 0 && (
                  <div className="mt-2.5 border-t border-divider/40 pt-2 text-xs text-default-500">
                    <span className="font-bold text-default-600">続いて: </span>
                    {subsequentTeams.slice(0, 3).map((item, i) => (
                      <span key={item.id}>
                        {i > 0 && ", "}
                        {item.pitNumber
                          ? `Pit ${item.pitNumber}`
                          : item.teamName}
                      </span>
                    ))}
                    {subsequentTeams.length > 3 && (
                      <span> 他{subsequentTeams.length - 3}組</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </CardBody>

      {/* Card Footer (Optional bottom summary) */}
      <CardFooter className="border-t border-divider/40 bg-content2/20 px-4 py-2 text-center text-xs text-default-400">
        <span className="w-full text-center font-medium">
          {totalWaitingCount === 0
            ? "待ちなし・すぐに受付可能です"
            : `合計 ${totalWaitingCount} チームが待機中`}
        </span>
      </CardFooter>
    </Card>
  );
}
