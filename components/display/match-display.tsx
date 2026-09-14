"use client";

import React, { useEffect, useState, useMemo } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { Card, CardHeader, CardBody, Chip, Button } from "@heroui/react";
import { Icon } from "@iconify/react";

import { firestore } from "@/lib/firebase/clientApp";
import { MatchData, MATCH_COLLECTION } from "@/types/match";
import {
  useCallingAnnouncer,
  CallingTargetItem,
} from "@/lib/client/use-calling-announcer";

export function MatchDisplayComponent() {
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // リアルタイム時計
  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // フルスクリーン切り替えリスナー
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // 試合データ（Firestore）購読
  useEffect(() => {
    const q = query(
      collection(firestore, MATCH_COLLECTION),
      orderBy("match_index", "asc"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs: MatchData[] = [];

      snapshot.forEach((doc) => {
        docs.push(doc.data() as MatchData);
      });
      docs.sort(
        (a, b) =>
          (a.match_no ?? a.match_index ?? 0) -
          (b.match_no ?? b.match_index ?? 0),
      );
      setMatches(docs);
    });

    return () => unsubscribe();
  }, []);

  // 進行中の試合 (in_progress の最小 index、なければ 1)
  const currentMatch =
    matches.find((m) => m.status === "in_progress") ||
    matches.find((m) => m.status === "scheduled") ||
    matches[0];

  const currentMatchIndex = currentMatch
    ? (currentMatch.match_no ?? currentMatch.match_index)
    : 1;

  // 1試合前、2試合前、3試合前
  const nextMatch1 = matches.find(
    (m) => (m.match_no ?? m.match_index) === currentMatchIndex + 1,
  );
  const nextMatch2 = matches.find(
    (m) => (m.match_no ?? m.match_index) === currentMatchIndex + 2,
  );
  const nextMatch3 = matches.find(
    (m) => (m.match_no ?? m.match_index) === currentMatchIndex + 3,
  );

  const formattedDate = currentTime
    ? currentTime.toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "short",
      })
    : "";

  const formattedTime = currentTime
    ? currentTime.toLocaleTimeString("ja-JP", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "";

  // 音声案内用の呼出中アイテム一覧を集約（1試合前移動対象）
  const callingItems = useMemo(() => {
    const items: CallingTargetItem[] = [];

    // 1試合前（コート移動対象）
    if (nextMatch1) {
      if (nextMatch1.team_red) {
        items.push({
          id: `match_${nextMatch1.id}_red`,
          pitNumber: nextMatch1.team_red.team_no,
          teamName:
            nextMatch1.team_red.display_name || nextMatch1.team_red.team_name,
        });
      }
      if (nextMatch1.team_blue) {
        items.push({
          id: `match_${nextMatch1.id}_blue`,
          pitNumber: nextMatch1.team_blue.team_no,
          teamName:
            nextMatch1.team_blue.display_name || nextMatch1.team_blue.team_name,
        });
      }
    }

    return items;
  }, [nextMatch1]);

  // 音声アナウンス監視フック
  const { isVoiceEnabled, toggleVoiceEnabled, volume } = useCallingAnnouncer(
    callingItems,
    matches.length > 0,
  );

  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-100 p-3 text-slate-900 lg:p-5">
      {/* Header Bar */}
      <header className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-slate-300 bg-white px-4 py-2.5 shadow-md lg:mb-4 lg:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
            <Icon className="text-2xl" icon="solar:videocamera-record-bold" />
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 lg:text-3xl">
              試合進行・お呼び出し
            </h1>
            <Chip
              className="animate-pulse font-black text-white"
              color="success"
              size="md"
              variant="solid"
            >
              <span className="flex items-center gap-1.5 px-1">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-white" />
                LIVE
              </span>
            </Chip>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* 音声案内切替ボタン */}
          <Button
            aria-label="Toggle Voice Announcement"
            className={`font-bold transition-all ${
              isVoiceEnabled
                ? "border-2 border-emerald-500 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                : "border-2 border-rose-400 bg-rose-50 text-rose-700 hover:bg-rose-100"
            }`}
            size="sm"
            startContent={
              <Icon
                className="text-lg"
                icon={
                  isVoiceEnabled
                    ? "solar:volume-loud-bold"
                    : "solar:volume-cross-bold"
                }
              />
            }
            title={
              isVoiceEnabled
                ? `音声案内: ON (${Math.round(volume * 100)}%) クリックでミュート`
                : "音声案内: ミュート中 (クリックで有効化)"
            }
            variant="flat"
            onPress={toggleVoiceEnabled}
          >
            {isVoiceEnabled ? "音声: ON" : "ミュート中 (OFF)"}
          </Button>

          <Button
            isIconOnly
            aria-label="Toggle Fullscreen"
            className="border-slate-300 text-slate-700 hover:bg-slate-100"
            size="sm"
            variant="bordered"
            onPress={toggleFullscreen}
          >
            <Icon
              className="text-xl"
              icon={
                isFullscreen
                  ? "solar:minimize-square-bold"
                  : "solar:maximize-square-bold"
              }
            />
          </Button>

          <div className="text-right">
            <div className="text-xs font-bold text-slate-600">
              {formattedDate}
            </div>
            <div className="font-mono text-2xl font-black tracking-wider text-slate-950 lg:text-3xl">
              {formattedTime}
            </div>
          </div>
        </div>
      </header>

      {matches.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
          <Icon
            className="mb-4 text-5xl text-slate-400"
            icon="solar:notes-bold"
          />
          <h2 className="text-xl font-bold text-slate-700">
            試合スケジュールが登録されていません
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            「設定 &gt; 試合設定
            (/settings/match)」から対戦表を登録・同期してください。
          </p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-4">
          {/* Upper Section: 4 Match Cards */}
          <div className="grid flex-1 grid-cols-1 gap-3.5 sm:grid-cols-2 lg:gap-4 xl:grid-cols-4">
            {/* Card 1: 対戦中 (Current Match N) */}
            <Card className="flex flex-col overflow-hidden rounded-2xl border-2 border-emerald-600 bg-white shadow-lg">
              <CardHeader className="flex items-center justify-between border-b-2 border-emerald-800 bg-emerald-700 px-4 py-3 text-white">
                <div className="flex items-center gap-2">
                  <span className="flex h-3 w-3 animate-ping rounded-full bg-white" />
                  <h2 className="text-xl font-black text-white">
                    【対戦中】第{" "}
                    {currentMatch
                      ? (currentMatch.match_no ?? currentMatch.match_index)
                      : 1}{" "}
                    試合
                  </h2>
                </div>
                <Chip
                  className="border border-emerald-400 bg-emerald-950 font-extrabold text-white"
                  color="success"
                  variant="solid"
                >
                  {currentMatch?.match_id}
                </Chip>
              </CardHeader>

              <CardBody className="flex flex-1 flex-col items-stretch justify-start gap-3 p-4">
                {currentMatch ? (
                  <>
                    <div className="rounded-xl border-2 border-emerald-500 bg-emerald-50 p-2 text-center shadow-sm">
                      <span className="text-xs font-bold text-slate-600">
                        状態:{" "}
                      </span>
                      <span className="text-base font-black text-emerald-900">
                        {currentMatch.current_phase || "試合実施中"}
                      </span>
                    </div>

                    {/* 赤チーム */}
                    <div className="flex flex-col gap-1.5 rounded-xl border-2 border-red-400 bg-red-50 p-3.5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-red-700">
                          赤 (RED)
                        </span>
                        <div className="inline-flex items-center gap-1 rounded-lg border border-red-700 bg-red-600 px-3 py-1 text-base font-black text-white shadow lg:text-lg">
                          Pit #{currentMatch.team_red.team_no}
                        </div>
                      </div>
                      <div className="truncate text-2xl font-black text-red-950 lg:text-3xl">
                        {currentMatch.team_red.display_name}
                      </div>
                      <div className="truncate text-sm font-bold text-red-800 lg:text-base">
                        {currentMatch.team_red.team_name}
                      </div>
                    </div>

                    <div className="py-0.5 text-center text-sm font-black text-slate-400">
                      VS
                    </div>

                    {/* 青チーム */}
                    <div className="flex flex-col gap-1.5 rounded-xl border-2 border-blue-400 bg-blue-50 p-3.5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-blue-700">
                          青 (BLUE)
                        </span>
                        <div className="inline-flex items-center gap-1 rounded-lg border border-blue-700 bg-blue-600 px-3 py-1 text-base font-black text-white shadow lg:text-lg">
                          Pit #{currentMatch.team_blue.team_no}
                        </div>
                      </div>
                      <div className="truncate text-2xl font-black text-blue-950 lg:text-3xl">
                        {currentMatch.team_blue.display_name}
                      </div>
                      <div className="truncate text-sm font-bold text-blue-800 lg:text-base">
                        {currentMatch.team_blue.team_name}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
                    対戦中の試合はありません
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Card 2: 1試合前 (Match N+1) - 移動中 */}
            <Card className="flex flex-col overflow-hidden rounded-2xl border-2 border-amber-500 bg-white shadow-lg">
              <CardHeader className="flex items-center justify-between border-b-2 border-amber-700 bg-amber-600 px-4 py-3 text-white">
                <div className="flex items-center gap-2">
                  <Icon
                    className="animate-bounce text-2xl text-white"
                    icon="solar:walking-bold"
                  />
                  <h2 className="text-xl font-black text-white">
                    【1試合前】第{" "}
                    {nextMatch1
                      ? (nextMatch1.match_no ?? nextMatch1.match_index)
                      : currentMatchIndex + 1}{" "}
                    試合
                  </h2>
                </div>
                <Chip
                  className="bg-amber-200 font-black text-amber-950"
                  color="warning"
                  variant="solid"
                >
                  1試合前
                </Chip>
              </CardHeader>

              <CardBody className="flex flex-1 flex-col items-stretch justify-start gap-3 p-4">
                {nextMatch1 ? (
                  <>
                    <div className="rounded-xl border-2 border-amber-500 bg-amber-50 p-2 text-center shadow-sm">
                      <p className="animate-pulse text-xs font-black text-amber-900 lg:text-sm">
                        ⚠️ コート待機場所へ移動してください！
                      </p>
                    </div>

                    {/* 赤チーム */}
                    <div className="flex flex-col gap-1.5 rounded-xl border-2 border-red-400 bg-red-50 p-3.5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-red-700">
                          赤 (RED)
                        </span>
                        <div className="inline-flex items-center gap-1 rounded-lg border border-red-700 bg-red-600 px-3 py-1 text-base font-black text-white shadow lg:text-lg">
                          Pit #{nextMatch1.team_red.team_no}
                        </div>
                      </div>
                      <div className="truncate text-2xl font-black text-red-950 lg:text-3xl">
                        {nextMatch1.team_red.display_name}
                      </div>
                      <div className="truncate text-sm font-bold text-red-800 lg:text-base">
                        {nextMatch1.team_red.team_name}
                      </div>
                    </div>

                    <div className="py-0.5 text-center text-sm font-black text-slate-400">
                      VS
                    </div>

                    {/* 青チーム */}
                    <div className="flex flex-col gap-1.5 rounded-xl border-2 border-blue-400 bg-blue-50 p-3.5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-blue-700">
                          青 (BLUE)
                        </span>
                        <div className="inline-flex items-center gap-1 rounded-lg border border-blue-700 bg-blue-600 px-3 py-1 text-base font-black text-white shadow lg:text-lg">
                          Pit #{nextMatch1.team_blue.team_no}
                        </div>
                      </div>
                      <div className="truncate text-2xl font-black text-blue-950 lg:text-3xl">
                        {nextMatch1.team_blue.display_name}
                      </div>
                      <div className="truncate text-sm font-bold text-blue-800 lg:text-base">
                        {nextMatch1.team_blue.team_name}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-1 items-center justify-center text-center text-xs text-slate-400">
                    対象の試合はありません
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Card 3: 2試合前 (Match N+2) - 移動中 */}
            <Card className="flex flex-col overflow-hidden rounded-2xl border-2 border-amber-500 bg-white shadow-lg">
              <CardHeader className="flex items-center justify-between border-b-2 border-amber-700 bg-amber-600 px-4 py-3 text-white">
                <div className="flex items-center gap-2">
                  <Icon
                    className="text-2xl text-white"
                    icon="solar:walking-bold"
                  />
                  <h2 className="text-xl font-black text-white">
                    【2試合前】第{" "}
                    {nextMatch2
                      ? (nextMatch2.match_no ?? nextMatch2.match_index)
                      : currentMatchIndex + 2}{" "}
                    試合
                  </h2>
                </div>
                <Chip
                  className="bg-amber-200 font-black text-amber-950"
                  color="warning"
                  variant="solid"
                >
                  2試合前
                </Chip>
              </CardHeader>

              <CardBody className="flex flex-1 flex-col items-stretch justify-start gap-3 p-4">
                {nextMatch2 ? (
                  <>
                    <div className="rounded-xl border-2 border-amber-500 bg-amber-50 p-2 text-center shadow-sm">
                      <p className="text-xs font-black text-amber-900 lg:text-sm">
                        ⚠️ コート待機場所へ移動してください
                      </p>
                    </div>

                    {/* 赤チーム */}
                    <div className="flex flex-col gap-1.5 rounded-xl border-2 border-red-400 bg-red-50 p-3.5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-red-700">
                          赤 (RED)
                        </span>
                        <div className="inline-flex items-center gap-1 rounded-lg border border-red-700 bg-red-600 px-3 py-1 text-base font-black text-white shadow lg:text-lg">
                          Pit #{nextMatch2.team_red.team_no}
                        </div>
                      </div>
                      <div className="truncate text-2xl font-black text-red-950 lg:text-3xl">
                        {nextMatch2.team_red.display_name}
                      </div>
                      <div className="truncate text-sm font-bold text-red-800 lg:text-base">
                        {nextMatch2.team_red.team_name}
                      </div>
                    </div>

                    <div className="py-0.5 text-center text-sm font-black text-slate-400">
                      VS
                    </div>

                    {/* 青チーム */}
                    <div className="flex flex-col gap-1.5 rounded-xl border-2 border-blue-400 bg-blue-50 p-3.5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-blue-700">
                          青 (BLUE)
                        </span>
                        <div className="inline-flex items-center gap-1 rounded-lg border border-blue-700 bg-blue-600 px-3 py-1 text-base font-black text-white shadow lg:text-lg">
                          Pit #{nextMatch2.team_blue.team_no}
                        </div>
                      </div>
                      <div className="truncate text-2xl font-black text-blue-950 lg:text-3xl">
                        {nextMatch2.team_blue.display_name}
                      </div>
                      <div className="truncate text-sm font-bold text-blue-800 lg:text-base">
                        {nextMatch2.team_blue.team_name}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-1 items-center justify-center text-center text-xs text-slate-400">
                    対象の試合はありません
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Card 4: 3試合前 (Match N+3) - 準備中 */}
            <Card className="flex flex-col overflow-hidden rounded-2xl border-2 border-blue-600 bg-white shadow-lg">
              <CardHeader className="flex items-center justify-between border-b-2 border-blue-800 bg-blue-700 px-4 py-3 text-white">
                <div className="flex items-center gap-2">
                  <Icon
                    className="text-2xl text-white"
                    icon="solar:bell-bold"
                  />
                  <h2 className="text-xl font-black text-white">
                    【3試合前】第{" "}
                    {nextMatch3
                      ? (nextMatch3.match_no ?? nextMatch3.match_index)
                      : currentMatchIndex + 3}{" "}
                    試合
                  </h2>
                </div>
                <Chip
                  className="bg-blue-900 font-bold text-white"
                  color="primary"
                  variant="solid"
                >
                  3試合前
                </Chip>
              </CardHeader>

              <CardBody className="flex flex-1 flex-col items-stretch justify-start gap-3 p-4">
                {nextMatch3 ? (
                  <>
                    <div className="rounded-xl border-2 border-blue-400 bg-blue-50 p-2 text-center shadow-sm">
                      <p className="text-xs font-black text-blue-900 lg:text-sm">
                        ℹ️ ピットで移動準備を開始してください
                      </p>
                    </div>

                    {/* 赤チーム */}
                    <div className="flex flex-col gap-1.5 rounded-xl border-2 border-red-400 bg-red-50 p-3.5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-red-700">
                          赤 (RED)
                        </span>
                        <div className="inline-flex items-center gap-1 rounded-lg border border-red-700 bg-red-600 px-3 py-1 text-base font-black text-white shadow lg:text-lg">
                          Pit #{nextMatch3.team_red.team_no}
                        </div>
                      </div>
                      <div className="truncate text-2xl font-black text-red-950 lg:text-3xl">
                        {nextMatch3.team_red.display_name}
                      </div>
                      <div className="truncate text-sm font-bold text-red-800 lg:text-base">
                        {nextMatch3.team_red.team_name}
                      </div>
                    </div>

                    <div className="py-0.5 text-center text-sm font-black text-slate-400">
                      VS
                    </div>

                    {/* 青チーム */}
                    <div className="flex flex-col gap-1.5 rounded-xl border-2 border-blue-400 bg-blue-50 p-3.5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-blue-700">
                          青 (BLUE)
                        </span>
                        <div className="inline-flex items-center gap-1 rounded-lg border border-blue-700 bg-blue-600 px-3 py-1 text-base font-black text-white shadow lg:text-lg">
                          Pit #{nextMatch3.team_blue.team_no}
                        </div>
                      </div>
                      <div className="truncate text-2xl font-black text-blue-950 lg:text-3xl">
                        {nextMatch3.team_blue.display_name}
                      </div>
                      <div className="truncate text-sm font-bold text-blue-800 lg:text-base">
                        {nextMatch3.team_blue.team_name}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-1 items-center justify-center text-center text-xs text-slate-400">
                    対象の試合はありません
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
