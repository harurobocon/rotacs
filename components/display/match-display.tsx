"use client";

import React, { useEffect, useState, useMemo } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { firestore } from "@/lib/firebase/clientApp";
import { MatchData, MATCH_COLLECTION } from "@/types/match";
import { onPracticeCollectionChange } from "@/lib/client/practice";
import { PracticeReservation, PracticeSchedule } from "@/types/practice";
import { Card, CardHeader, CardBody, Chip, Button } from "@heroui/react";
import { Icon } from "@iconify/react";

function formatTime(d: Date | null | undefined): string | null {
  if (!d) return null;
  try {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return null;
  }
}

export function MatchDisplayComponent() {
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [practiceReservations, setPracticeReservations] = useState<PracticeReservation[] | null>(null);
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
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
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
      orderBy("match_index", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs: MatchData[] = [];
      snapshot.forEach((doc) => {
        docs.push(doc.data() as MatchData);
      });
      setMatches(docs);
    });

    return () => unsubscribe();
  }, []);

  // 試走場データ（Firestore）購読
  useEffect(() => {
    const unsubscribe = onPracticeCollectionChange((snapshot) => {
      setPracticeReservations(snapshot.docs.map((doc) => doc.data()));
    });
    return () => unsubscribe();
  }, []);

  // 進行中の試合 (in_progress の最小 index、なければ 1)
  const currentMatch =
    matches.find((m) => m.status === "in_progress") ||
    matches.find((m) => m.status === "scheduled") ||
    matches[0];

  const currentMatchIndex = currentMatch ? currentMatch.match_index : 1;

  // 1試合前、2試合前、3試合前
  const nextMatch1 = matches.find((m) => m.match_index === currentMatchIndex + 1);
  const nextMatch2 = matches.find((m) => m.match_index === currentMatchIndex + 2);
  const nextMatch3 = matches.find((m) => m.match_index === currentMatchIndex + 3);

  // 試走場（自由試走エリア）データの集計
  const practiceData = useMemo(() => {
    if (!practiceReservations || practiceReservations.length === 0) {
      return { calling: [], waiting: [], inProgress: [] };
    }

    const schedule = PracticeSchedule.fromUnsorted(practiceReservations);
    const map = new Map(practiceReservations.map((r) => [r.id, r]));

    const calling = schedule
      .get("default", "呼出中")
      .map((id) => map.get(id))
      .filter((r): r is PracticeReservation => Boolean(r));

    const waiting = schedule
      .get("default", "順番待ち")
      .map((id) => map.get(id))
      .filter((r): r is PracticeReservation => Boolean(r));

    const inProgressIds = [
      ...schedule.get("default", "実施中"),
      ...schedule.get("default", "移動中"),
    ];
    const inProgress = inProgressIds
      .map((id) => map.get(id))
      .filter((r): r is PracticeReservation => Boolean(r));

    return { calling, waiting, inProgress };
  }, [practiceReservations]);

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

        <div className="flex items-center gap-4">
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
              icon={isFullscreen ? "solar:minimize-square-bold" : "solar:maximize-square-bold"}
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
          <Icon className="mb-4 text-5xl text-slate-400" icon="solar:notes-bold" />
          <h2 className="text-xl font-bold text-slate-700">試合スケジュールが登録されていません</h2>
          <p className="mt-2 text-sm text-slate-500">
            「設定 &gt; 試合設定 (/settings/match)」から対戦表を登録・同期してください。
          </p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-4">
          {/* Upper Section: 4 Match Cards */}
          <div className="grid flex-1 grid-cols-1 gap-3.5 sm:grid-cols-2 lg:gap-4 xl:grid-cols-4">
            {/* Card 1: 対戦中 (Current Match N) */}
            <Card className="flex flex-col border-2 border-emerald-600 bg-white shadow-lg rounded-2xl overflow-hidden">
              <CardHeader className="flex items-center justify-between border-b-2 border-emerald-800 bg-emerald-700 px-4 py-3 text-white">
                <div className="flex items-center gap-2">
                  <span className="flex h-3 w-3 rounded-full bg-white animate-ping" />
                  <h2 className="text-xl font-black text-white">
                    【対戦中】第 {currentMatch?.match_index ?? 1} 試合
                  </h2>
                </div>
                <Chip color="success" variant="solid" className="font-extrabold text-white bg-emerald-950 border border-emerald-400">
                  {currentMatch?.match_id}
                </Chip>
              </CardHeader>

              <CardBody className="flex flex-col gap-3 p-4 flex-1 justify-start items-stretch">
                {currentMatch ? (
                  <>
                    <div className="rounded-xl border-2 border-emerald-500 bg-emerald-50 p-2 text-center shadow-sm">
                      <span className="text-xs font-bold text-slate-600">状態: </span>
                      <span className="text-base font-black text-emerald-900">
                        {currentMatch.current_phase || "試合実施中"}
                      </span>
                    </div>

                    {/* 赤チーム */}
                    <div className="rounded-xl border-2 border-red-400 bg-red-50 p-3.5 flex flex-col gap-1.5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-red-700">赤 (RED)</span>
                        <div className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1 text-base lg:text-lg font-black text-white shadow border border-red-700">
                          Pit #{currentMatch.team_red.team_no}
                        </div>
                      </div>
                      <div className="text-2xl font-black text-red-950 truncate lg:text-3xl">
                        {currentMatch.team_red.display_name}
                      </div>
                      <div className="text-sm font-bold text-red-800 truncate lg:text-base">
                        {currentMatch.team_red.team_name}
                      </div>
                    </div>

                    <div className="text-center font-black text-slate-400 text-sm py-0.5">VS</div>

                    {/* 青チーム */}
                    <div className="rounded-xl border-2 border-blue-400 bg-blue-50 p-3.5 flex flex-col gap-1.5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-blue-700">青 (BLUE)</span>
                        <div className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1 text-base lg:text-lg font-black text-white shadow border border-blue-700">
                          Pit #{currentMatch.team_blue.team_no}
                        </div>
                      </div>
                      <div className="text-2xl font-black text-blue-950 truncate lg:text-3xl">
                        {currentMatch.team_blue.display_name}
                      </div>
                      <div className="text-sm font-bold text-blue-800 truncate lg:text-base">
                        {currentMatch.team_blue.team_name}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-1 items-center justify-center text-slate-500 text-sm">対戦中の試合はありません</div>
                )}
              </CardBody>
            </Card>

            {/* Card 2: 1試合前 (Match N+1) - 移動中 */}
            <Card className="flex flex-col border-2 border-amber-500 bg-white shadow-lg rounded-2xl overflow-hidden">
              <CardHeader className="flex items-center justify-between border-b-2 border-amber-700 bg-amber-600 px-4 py-3 text-white">
                <div className="flex items-center gap-2">
                  <Icon className="text-2xl text-white animate-bounce" icon="solar:walking-bold" />
                  <h2 className="text-xl font-black text-white">
                    【1試合前】第 {nextMatch1?.match_index ?? currentMatchIndex + 1} 試合
                  </h2>
                </div>
                <Chip color="warning" variant="solid" className="font-black text-amber-950 bg-amber-200">
                  1試合前
                </Chip>
              </CardHeader>

              <CardBody className="flex flex-col gap-3 p-4 flex-1 justify-start items-stretch">
                {nextMatch1 ? (
                  <>
                    <div className="rounded-xl border-2 border-amber-500 bg-amber-50 p-2 text-center shadow-sm">
                      <p className="text-xs font-black text-amber-900 animate-pulse lg:text-sm">
                        ⚠️ コート待機場所へ移動してください！
                      </p>
                    </div>

                    {/* 赤チーム */}
                    <div className="rounded-xl border-2 border-red-400 bg-red-50 p-3.5 flex flex-col gap-1.5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-red-700">赤 (RED)</span>
                        <div className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1 text-base lg:text-lg font-black text-white shadow border border-red-700">
                          Pit #{nextMatch1.team_red.team_no}
                        </div>
                      </div>
                      <div className="text-2xl font-black text-red-950 truncate lg:text-3xl">
                        {nextMatch1.team_red.display_name}
                      </div>
                      <div className="text-sm font-bold text-red-800 truncate lg:text-base">
                        {nextMatch1.team_red.team_name}
                      </div>
                    </div>

                    <div className="text-center font-black text-slate-400 text-sm py-0.5">VS</div>

                    {/* 青チーム */}
                    <div className="rounded-xl border-2 border-blue-400 bg-blue-50 p-3.5 flex flex-col gap-1.5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-blue-700">青 (BLUE)</span>
                        <div className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1 text-base lg:text-lg font-black text-white shadow border border-blue-700">
                          Pit #{nextMatch1.team_blue.team_no}
                        </div>
                      </div>
                      <div className="text-2xl font-black text-blue-950 truncate lg:text-3xl">
                        {nextMatch1.team_blue.display_name}
                      </div>
                      <div className="text-sm font-bold text-blue-800 truncate lg:text-base">
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
            <Card className="flex flex-col border-2 border-amber-500 bg-white shadow-lg rounded-2xl overflow-hidden">
              <CardHeader className="flex items-center justify-between border-b-2 border-amber-700 bg-amber-600 px-4 py-3 text-white">
                <div className="flex items-center gap-2">
                  <Icon className="text-2xl text-white" icon="solar:walking-bold" />
                  <h2 className="text-xl font-black text-white">
                    【2試合前】第 {nextMatch2?.match_index ?? currentMatchIndex + 2} 試合
                  </h2>
                </div>
                <Chip color="warning" variant="solid" className="font-black text-amber-950 bg-amber-200">
                  2試合前
                </Chip>
              </CardHeader>

              <CardBody className="flex flex-col gap-3 p-4 flex-1 justify-start items-stretch">
                {nextMatch2 ? (
                  <>
                    <div className="rounded-xl border-2 border-amber-500 bg-amber-50 p-2 text-center shadow-sm">
                      <p className="text-xs font-black text-amber-900 lg:text-sm">
                        ⚠️ コート待機場所へ移動準備
                      </p>
                    </div>

                    {/* 赤チーム */}
                    <div className="rounded-xl border-2 border-red-400 bg-red-50 p-3.5 flex flex-col gap-1.5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-red-700">赤 (RED)</span>
                        <div className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1 text-base lg:text-lg font-black text-white shadow border border-red-700">
                          Pit #{nextMatch2.team_red.team_no}
                        </div>
                      </div>
                      <div className="text-2xl font-black text-red-950 truncate lg:text-3xl">
                        {nextMatch2.team_red.display_name}
                      </div>
                      <div className="text-sm font-bold text-red-800 truncate lg:text-base">
                        {nextMatch2.team_red.team_name}
                      </div>
                    </div>

                    <div className="text-center font-black text-slate-400 text-sm py-0.5">VS</div>

                    {/* 青チーム */}
                    <div className="rounded-xl border-2 border-blue-400 bg-blue-50 p-3.5 flex flex-col gap-1.5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-blue-700">青 (BLUE)</span>
                        <div className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1 text-base lg:text-lg font-black text-white shadow border border-blue-700">
                          Pit #{nextMatch2.team_blue.team_no}
                        </div>
                      </div>
                      <div className="text-2xl font-black text-blue-950 truncate lg:text-3xl">
                        {nextMatch2.team_blue.display_name}
                      </div>
                      <div className="text-sm font-bold text-blue-800 truncate lg:text-base">
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
            <Card className="flex flex-col border-2 border-blue-600 bg-white shadow-lg rounded-2xl overflow-hidden">
              <CardHeader className="flex items-center justify-between border-b-2 border-blue-800 bg-blue-700 px-4 py-3 text-white">
                <div className="flex items-center gap-2">
                  <Icon className="text-2xl text-white" icon="solar:bell-bold" />
                  <h2 className="text-xl font-black text-white">
                    【3試合前】第 {nextMatch3?.match_index ?? currentMatchIndex + 3} 試合
                  </h2>
                </div>
                <Chip color="primary" variant="solid" className="font-bold text-white bg-blue-900">
                  3試合前
                </Chip>
              </CardHeader>

              <CardBody className="flex flex-col gap-3 p-4 flex-1 justify-start items-stretch">
                {nextMatch3 ? (
                  <>
                    <div className="rounded-xl border-2 border-blue-400 bg-blue-50 p-2 text-center shadow-sm">
                      <p className="text-xs font-black text-blue-900 lg:text-sm">
                        ℹ️ ピット/控室で移動準備を開始してください
                      </p>
                    </div>

                    {/* 赤チーム */}
                    <div className="rounded-xl border-2 border-red-400 bg-red-50 p-3.5 flex flex-col gap-1.5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-red-700">赤 (RED)</span>
                        <div className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1 text-base lg:text-lg font-black text-white shadow border border-red-700">
                          Pit #{nextMatch3.team_red.team_no}
                        </div>
                      </div>
                      <div className="text-2xl font-black text-red-950 truncate lg:text-3xl">
                        {nextMatch3.team_red.display_name}
                      </div>
                      <div className="text-sm font-bold text-red-800 truncate lg:text-base">
                        {nextMatch3.team_red.team_name}
                      </div>
                    </div>

                    <div className="text-center font-black text-slate-400 text-sm py-0.5">VS</div>

                    {/* 青チーム */}
                    <div className="rounded-xl border-2 border-blue-400 bg-blue-50 p-3.5 flex flex-col gap-1.5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-blue-700">青 (BLUE)</span>
                        <div className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1 text-base lg:text-lg font-black text-white shadow border border-blue-700">
                          Pit #{nextMatch3.team_blue.team_no}
                        </div>
                      </div>
                      <div className="text-2xl font-black text-blue-950 truncate lg:text-3xl">
                        {nextMatch3.team_blue.display_name}
                      </div>
                      <div className="text-sm font-bold text-blue-800 truncate lg:text-base">
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

          {/* Lower Section: Practice Field Status (試走場 進行状況) */}
          <section className="rounded-2xl border-2 border-slate-300 bg-white p-4 shadow-md">
            <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-white">
                  <Icon className="text-xl" icon="solar:steering-wheel-bold" />
                </div>
                <h3 className="text-xl font-black text-slate-900">試走場（自由試走エリア）進行状況</h3>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 border border-slate-300">
                リアルタイム自動更新
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* 1. 実施中 */}
              <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50/60 p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between font-black text-emerald-900 text-sm border-b border-emerald-200 pb-1.5">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 animate-pulse" />
                    【実施中】
                  </span>
                  <span className="text-emerald-700 font-bold">{practiceData.inProgress.length}件</span>
                </div>
                <div className="flex flex-wrap gap-2 min-h-[36px] items-center">
                  {practiceData.inProgress.length > 0 ? (
                    practiceData.inProgress.map((r) => (
                      <span
                        key={r.id}
                        className="rounded-lg bg-emerald-600 text-white px-3 py-1.5 text-sm lg:text-base font-black shadow-sm border border-emerald-700"
                      >
                        Pit #{r.pit_number} {r.user_display_name}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs font-bold text-slate-400">現在実施中のチームはありません</span>
                  )}
                </div>
              </div>

              {/* 2. お呼び出し中 */}
              <div className="rounded-xl border-2 border-red-300 bg-red-50/60 p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between font-black text-red-900 text-sm border-b border-red-200 pb-1.5">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-600 animate-ping" />
                    【お呼び出し中】
                  </span>
                  <span className="text-red-700 font-bold">{practiceData.calling.length}件</span>
                </div>
                <div className="flex flex-wrap gap-2 min-h-[36px] items-center">
                  {practiceData.calling.length > 0 ? (
                    practiceData.calling.map((r) => (
                      <span
                        key={r.id}
                        className="rounded-lg bg-red-600 text-white px-3 py-1.5 text-sm lg:text-base font-black shadow-sm border border-red-700 animate-pulse"
                      >
                        Pit #{r.pit_number} {r.user_display_name} {r.fixed_at ? `(${formatTime(r.fixed_at)})` : ""}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs font-bold text-slate-400">呼出中のチームはありません</span>
                  )}
                </div>
              </div>

              {/* 3. 順番待ち */}
              <div className="rounded-xl border-2 border-slate-300 bg-slate-50 p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between font-black text-slate-900 text-sm border-b border-slate-200 pb-1.5">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-500" />
                    【順番待ち】
                  </span>
                  <span className="text-slate-600 font-bold">{practiceData.waiting.length}件</span>
                </div>
                <div className="flex flex-wrap gap-2 min-h-[36px] items-center">
                  {practiceData.waiting.length > 0 ? (
                    practiceData.waiting.map((r, idx) => (
                      <span
                        key={r.id}
                        className="rounded-lg bg-white text-slate-900 border-2 border-slate-300 px-3 py-1.5 text-sm lg:text-base font-bold shadow-sm"
                      >
                        <span className="font-black text-slate-500 mr-1">#{idx + 1}</span>
                        Pit #{r.pit_number} {r.user_display_name}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs font-bold text-slate-400">待ちチームはありません</span>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}


