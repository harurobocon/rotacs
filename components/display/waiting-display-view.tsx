"use client";

import React from "react";
import Link from "next/link";
import { Button, Chip, Spinner, Tooltip } from "@heroui/react";
import { Icon } from "@iconify/react";

import {
  WaitingCard,
  WaitingCardLane,
  WaitingItem,
} from "@/components/display/waiting-card";
import {
  CHECK1_COLLECTION,
  CHECK2_COLLECTION,
  CheckReservation,
  CheckSchedule,
  CheckSide,
  getCheckSides,
} from "@/types/check";
import { TestrunReservation, TestrunSchedule } from "@/types/testrun";
import { PracticeReservation, PracticeSchedule } from "@/types/practice";
import { onCheckCollectionChange } from "@/lib/client/check";
import { onTestrunCollectionChange } from "@/lib/client/testrun";
import { onPracticeCollectionChange } from "@/lib/client/practice";
import {
  getCheckLocationSettings,
  listenCheckLocationSettings,
} from "@/lib/client/settings";
import { CheckLocationMode, CheckLocationSettings } from "@/types/settings";

interface WaitingDisplayViewProps {
  checkType: "check1" | "check2";
}

function formatTime(d: Date | null | undefined): string | null {
  if (!d) return null;

  try {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return null;
  }
}

export function WaitingDisplayView({ checkType }: WaitingDisplayViewProps) {
  // Clock state
  const [currentTime, setCurrentTime] = React.useState<Date | null>(null);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  // Demo mode state
  const [isDemo, setIsDemo] = React.useState(false);
  const [demoScenario, setDemoScenario] = React.useState<
    "standard" | "heavy" | "idle"
  >("standard");

  // Check URL query param for demo
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);

      if (params.get("demo") === "1" || params.get("demo") === "true") {
        setIsDemo(true);
      }
    }
  }, []);

  // Firestore raw collections state
  const [checkReservations, setCheckReservations] = React.useState<
    CheckReservation[] | null
  >(null);
  const [testrunReservations, setTestrunReservations] = React.useState<
    TestrunReservation[] | null
  >(null);
  const [practiceReservations, setPracticeReservations] = React.useState<
    PracticeReservation[] | null
  >(null);
  const [checkSettings, setCheckSettings] =
    React.useState<CheckLocationSettings | null>(null);

  const activeCheckCollection =
    checkType === "check1" ? CHECK1_COLLECTION : CHECK2_COLLECTION;

  // Real-time Clock
  React.useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fullscreen change listener
  React.useEffect(() => {
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

  // Firestore listeners
  React.useEffect(() => {
    getCheckLocationSettings().then(setCheckSettings);
    const unsubscribeSettings = listenCheckLocationSettings(setCheckSettings);

    const unsubscribeCheck = onCheckCollectionChange(
      activeCheckCollection,
      (snapshot) => {
        setCheckReservations(snapshot.docs.map((doc) => doc.data()));
      },
    );

    const unsubscribeTestrun = onTestrunCollectionChange((snapshot) => {
      setTestrunReservations(snapshot.docs.map((doc) => doc.data()));
    });

    const unsubscribePractice = onPracticeCollectionChange((snapshot) => {
      setPracticeReservations(snapshot.docs.map((doc) => doc.data()));
    });

    return () => {
      unsubscribeSettings();
      unsubscribeCheck();
      unsubscribeTestrun();
      unsubscribePractice();
    };
  }, [activeCheckCollection]);

  // Compute Check Card Data
  const checkCardData = React.useMemo(() => {
    const title = checkType === "check1" ? "計量計測1" : "計量計測2";
    const subtitle = checkType === "check1" ? "前日計量" : "当日計量";
    const colorTheme: "emerald" | "teal" =
      checkType === "check1" ? "emerald" : "teal";

    // Demo Data overrides
    if (isDemo) {
      if (demoScenario === "idle") {
        return {
          title,
          subtitle,
          icon: "solar:scale-bold",
          colorTheme,
          lanes: [
            {
              calling: [],
              next: [],
              inProgress: [],
            },
          ],
          totalWaitingCount: 0,
        };
      }

      const lanes: WaitingCardLane[] = [
        {
          laneName: "西",
          calling: [
            {
              id: "demo-c1",
              pitNumber: 3,
              teamName: "東海ロボコン工科大学",
              count: 1,
              time: "10:45",
              status: "呼出中",
            },
          ],
          next: [
            {
              id: "demo-c2",
              pitNumber: 14,
              teamName: "早稲田ロボット研究会",
              count: 1,
              status: "順番待ち",
            },
            {
              id: "demo-c3",
              pitNumber: 22,
              teamName: "東京工科大学",
              count: 1,
              status: "順番待ち",
            },
            ...(demoScenario === "heavy"
              ? [
                  {
                    id: "demo-c4",
                    pitNumber: 7,
                    teamName: "豊橋技科大ロボコン同好会",
                    count: 1,
                    status: "順番待ち",
                  },
                  {
                    id: "demo-c5",
                    pitNumber: 19,
                    teamName: "東京大学 Robotech",
                    count: 1,
                    status: "順番待ち",
                  },
                ]
              : []),
          ],
          inProgress: [],
        },
        {
          laneName: "東",
          calling: [],
          next: [
            {
              id: "demo-c6",
              pitNumber: 1,
              teamName: "東京農工大学 R.U.R",
              count: 1,
              status: "順番待ち",
            },
            {
              id: "demo-c7",
              pitNumber: 18,
              teamName: "電気通信大学 ロボメカ工房",
              count: 1,
              status: "順番待ち",
            },
          ],
          inProgress: [
            {
              id: "demo-c8",
              pitNumber: 9,
              teamName: "京都工芸繊維大学",
              count: 1,
              status: "実施中",
            },
          ],
        },
      ];

      return {
        title,
        subtitle,
        icon: "solar:scale-bold",
        colorTheme,
        lanes,
        totalWaitingCount: lanes.reduce(
          (acc, lane) => acc + lane.next.length,
          0,
        ),
      };
    }

    if (!checkReservations) {
      return {
        title,
        subtitle,
        icon: "solar:scale-bold",
        colorTheme,
        lanes: [],
        totalWaitingCount: 0,
      };
    }

    const mode: CheckLocationMode = checkSettings
      ? checkSettings[checkType]
      : "single";
    const sides: CheckSide[] = getCheckSides(mode);
    const schedule = CheckSchedule.fromUnsorted(checkReservations, mode);
    const map = new Map(checkReservations.map((r) => [r.id, r]));

    const lanes: WaitingCardLane[] = sides.map((side) => {
      const calling = schedule
        .get(side, "呼出中")
        .map((id) => map.get(id))
        .filter(Boolean)
        .map(
          (r): WaitingItem => ({
            id: r!.id,
            pitNumber: r!.pit_number,
            teamName: r!.user_display_name,
            count: r!.reservation_count,
            time: formatTime(r!.fixed_at),
            side: r!.side,
            status: r!.status,
          }),
        );

      const next = schedule
        .get(side, "順番待ち")
        .map((id) => map.get(id))
        .filter(Boolean)
        .map(
          (r): WaitingItem => ({
            id: r!.id,
            pitNumber: r!.pit_number,
            teamName: r!.user_display_name,
            count: r!.reservation_count,
            time: null,
            side: r!.side,
            status: r!.status,
          }),
        );

      const inProgressIds = [
        ...schedule.get(side, "実施中"),
        ...schedule.get(side, "移動中"),
      ];
      const inProgress = inProgressIds
        .map((id) => map.get(id))
        .filter(Boolean)
        .map(
          (r): WaitingItem => ({
            id: r!.id,
            pitNumber: r!.pit_number,
            teamName: r!.user_display_name,
            count: r!.reservation_count,
            time: formatTime(r!.started_at ?? r!.fixed_at),
            side: r!.side,
            status: r!.status,
          }),
        );

      return {
        laneName: mode === "dual" ? side : undefined,
        calling,
        next,
        inProgress,
      };
    });

    const totalWaitingCount = lanes.reduce(
      (acc, lane) => acc + lane.next.length,
      0,
    );

    return {
      title,
      subtitle,
      icon: "solar:scale-bold",
      colorTheme,
      lanes,
      totalWaitingCount,
    };
  }, [checkReservations, checkSettings, checkType, isDemo, demoScenario]);

  // Compute Testrun Red Card Data
  const testrunRedData = React.useMemo(() => {
    const title = "テストラン（赤）";
    const subtitle = "赤フィールド";

    if (isDemo) {
      if (demoScenario === "idle") {
        return {
          title,
          subtitle,
          icon: "solar:flag-bold",
          colorTheme: "rose" as const,
          lanes: [{ calling: [], next: [], inProgress: [] }],
          totalWaitingCount: 0,
        };
      }

      const nextList: WaitingItem[] = [
        {
          id: "demo-tr-1",
          pitNumber: 8,
          teamName: "名古屋工業大学",
          count: 1,
          status: "順番待ち",
        },
        {
          id: "demo-tr-2",
          pitNumber: 2,
          teamName: "舞鶴高専",
          count: 1,
          status: "順番待ち",
        },
        ...(demoScenario === "heavy"
          ? [
              {
                id: "demo-tr-3",
                pitNumber: 11,
                teamName: "長岡技術科学大学",
                count: 1,
                status: "順番待ち",
              },
              {
                id: "demo-tr-4",
                pitNumber: 15,
                teamName: "信州大学",
                count: 2,
                status: "順番待ち",
              },
            ]
          : []),
      ];

      return {
        title,
        subtitle,
        icon: "solar:flag-bold",
        colorTheme: "rose" as const,
        lanes: [
          {
            calling: [
              {
                id: "demo-tr-c",
                pitNumber: 5,
                teamName: "京都大学 機械研究会",
                count: 2,
                time: "10:46",
                status: "呼出中",
              },
            ],
            next: nextList,
            inProgress: [],
          },
        ],
        totalWaitingCount: nextList.length,
      };
    }

    if (!testrunReservations) {
      return {
        title,
        subtitle,
        icon: "solar:flag-bold",
        colorTheme: "rose" as const,
        lanes: [],
        totalWaitingCount: 0,
      };
    }

    const schedule = TestrunSchedule.fromUnsorted(testrunReservations);
    const map = new Map(testrunReservations.map((r) => [r.id, r]));

    const calling = schedule
      .get("赤", "呼出中")
      .map((id) => map.get(id))
      .filter(Boolean)
      .map(
        (r): WaitingItem => ({
          id: r!.id,
          pitNumber: r!.pit_number,
          teamName: r!.user_display_name,
          count: r!.reservation_count,
          time: formatTime(r!.fixed_at),
          side: "赤",
          status: r!.status,
        }),
      );

    const next = schedule
      .get("赤", "順番待ち")
      .map((id) => map.get(id))
      .filter(Boolean)
      .map(
        (r): WaitingItem => ({
          id: r!.id,
          pitNumber: r!.pit_number,
          teamName: r!.user_display_name,
          count: r!.reservation_count,
          time: null,
          side: "赤",
          status: r!.status,
        }),
      );

    const inProgressIds = [
      ...schedule.get("赤", "実施中"),
      ...schedule.get("赤", "スタンバイ中"),
      ...schedule.get("赤", "移動中"),
    ];
    const inProgress = inProgressIds
      .map((id) => map.get(id))
      .filter(Boolean)
      .map(
        (r): WaitingItem => ({
          id: r!.id,
          pitNumber: r!.pit_number,
          teamName: r!.user_display_name,
          count: r!.reservation_count,
          time: formatTime(r!.started_at ?? r!.fixed_at),
          side: "赤",
          status: r!.status,
        }),
      );

    return {
      title,
      subtitle,
      icon: "solar:flag-bold",
      colorTheme: "rose" as const,
      lanes: [
        {
          calling,
          next,
          inProgress,
        },
      ],
      totalWaitingCount: next.length,
    };
  }, [testrunReservations, isDemo, demoScenario]);

  // Compute Testrun Blue Card Data
  const testrunBlueData = React.useMemo(() => {
    const title = "テストラン（青）";
    const subtitle = "青フィールド";

    if (isDemo) {
      if (demoScenario === "idle") {
        return {
          title,
          subtitle,
          icon: "solar:flag-bold",
          colorTheme: "blue" as const,
          lanes: [{ calling: [], next: [], inProgress: [] }],
          totalWaitingCount: 0,
        };
      }

      const nextList: WaitingItem[] = [
        {
          id: "demo-tb-1",
          pitNumber: 16,
          teamName: "大阪公立大学 ロボット工学研究会",
          count: 1,
          status: "順番待ち",
        },
        {
          id: "demo-tb-2",
          pitNumber: 20,
          teamName: "千葉大学",
          count: 1,
          status: "順番待ち",
        },
        ...(demoScenario === "heavy"
          ? [
              {
                id: "demo-tb-3",
                pitNumber: 24,
                teamName: "熊本大学",
                count: 1,
                status: "順番待ち",
              },
            ]
          : []),
      ];

      return {
        title,
        subtitle,
        icon: "solar:flag-bold",
        colorTheme: "blue" as const,
        lanes: [
          {
            calling: [],
            next: nextList,
            inProgress: [
              {
                id: "demo-tb-prog",
                pitNumber: 12,
                teamName: "東京工業大学 ロボット技術研究会",
                count: 1,
                status: "実施中",
              },
            ],
          },
        ],
        totalWaitingCount: nextList.length,
      };
    }

    if (!testrunReservations) {
      return {
        title,
        subtitle,
        icon: "solar:flag-bold",
        colorTheme: "blue" as const,
        lanes: [],
        totalWaitingCount: 0,
      };
    }

    const schedule = TestrunSchedule.fromUnsorted(testrunReservations);
    const map = new Map(testrunReservations.map((r) => [r.id, r]));

    const calling = schedule
      .get("青", "呼出中")
      .map((id) => map.get(id))
      .filter(Boolean)
      .map(
        (r): WaitingItem => ({
          id: r!.id,
          pitNumber: r!.pit_number,
          teamName: r!.user_display_name,
          count: r!.reservation_count,
          time: formatTime(r!.fixed_at),
          side: "青",
          status: r!.status,
        }),
      );

    const next = schedule
      .get("青", "順番待ち")
      .map((id) => map.get(id))
      .filter(Boolean)
      .map(
        (r): WaitingItem => ({
          id: r!.id,
          pitNumber: r!.pit_number,
          teamName: r!.user_display_name,
          count: r!.reservation_count,
          time: null,
          side: "青",
          status: r!.status,
        }),
      );

    const inProgressIds = [
      ...schedule.get("青", "実施中"),
      ...schedule.get("青", "スタンバイ中"),
      ...schedule.get("青", "移動中"),
    ];
    const inProgress = inProgressIds
      .map((id) => map.get(id))
      .filter(Boolean)
      .map(
        (r): WaitingItem => ({
          id: r!.id,
          pitNumber: r!.pit_number,
          teamName: r!.user_display_name,
          count: r!.reservation_count,
          time: formatTime(r!.started_at ?? r!.fixed_at),
          side: "青",
          status: r!.status,
        }),
      );

    return {
      title,
      subtitle,
      icon: "solar:flag-bold",
      colorTheme: "blue" as const,
      lanes: [
        {
          calling,
          next,
          inProgress,
        },
      ],
      totalWaitingCount: next.length,
    };
  }, [testrunReservations, isDemo, demoScenario]);

  // Compute Practice Card Data
  const practiceData = React.useMemo(() => {
    const title = "試走場";
    const subtitle = "自由試走エリア";

    if (isDemo) {
      if (demoScenario === "idle") {
        return {
          title,
          subtitle,
          icon: "solar:steering-wheel-bold",
          colorTheme: "amber" as const,
          lanes: [{ calling: [], next: [], inProgress: [] }],
          totalWaitingCount: 0,
        };
      }

      const nextList: WaitingItem[] = [
        {
          id: "demo-p-1",
          pitNumber: 6,
          teamName: "九州工業大学",
          count: 2,
          status: "順番待ち",
        },
        {
          id: "demo-p-2",
          pitNumber: 10,
          teamName: "金沢大学",
          count: 1,
          status: "順番待ち",
        },
        ...(demoScenario === "heavy"
          ? [
              {
                id: "demo-p-3",
                pitNumber: 13,
                teamName: "新潟大学",
                count: 1,
                status: "順番待ち",
              },
            ]
          : []),
      ];

      return {
        title,
        subtitle,
        icon: "solar:steering-wheel-bold",
        colorTheme: "amber" as const,
        lanes: [
          {
            calling: [
              {
                id: "demo-p-c",
                pitNumber: 4,
                teamName: "横浜国立大学 ロボット研究会",
                count: 3,
                time: "10:48",
                status: "呼出中",
              },
            ],
            next: nextList,
            inProgress: [],
          },
        ],
        totalWaitingCount: nextList.length,
      };
    }

    if (!practiceReservations) {
      return {
        title,
        subtitle,
        icon: "solar:steering-wheel-bold",
        colorTheme: "amber" as const,
        lanes: [],
        totalWaitingCount: 0,
      };
    }

    const schedule = PracticeSchedule.fromUnsorted(practiceReservations);
    const map = new Map(practiceReservations.map((r) => [r.id, r]));

    const calling = schedule
      .get("default", "呼出中")
      .map((id) => map.get(id))
      .filter(Boolean)
      .map(
        (r): WaitingItem => ({
          id: r!.id,
          pitNumber: r!.pit_number,
          teamName: r!.user_display_name,
          count: r!.reservation_count,
          time: formatTime(r!.fixed_at),
          side: "default",
          status: r!.status,
        }),
      );

    const next = schedule
      .get("default", "順番待ち")
      .map((id) => map.get(id))
      .filter(Boolean)
      .map(
        (r): WaitingItem => ({
          id: r!.id,
          pitNumber: r!.pit_number,
          teamName: r!.user_display_name,
          count: r!.reservation_count,
          time: null,
          side: "default",
          status: r!.status,
        }),
      );

    const inProgressIds = [
      ...schedule.get("default", "実施中"),
      ...schedule.get("default", "移動中"),
    ];
    const inProgress = inProgressIds
      .map((id) => map.get(id))
      .filter(Boolean)
      .map(
        (r): WaitingItem => ({
          id: r!.id,
          pitNumber: r!.pit_number,
          teamName: r!.user_display_name,
          count: r!.reservation_count,
          time: formatTime(r!.started_at ?? r!.fixed_at),
          side: "default",
          status: r!.status,
        }),
      );

    return {
      title,
      subtitle,
      icon: "solar:steering-wheel-bold",
      colorTheme: "amber" as const,
      lanes: [
        {
          calling,
          next,
          inProgress,
        },
      ],
      totalWaitingCount: next.length,
    };
  }, [practiceReservations, isDemo, demoScenario]);

  const isLoading =
    !isDemo &&
    (checkReservations === null ||
      testrunReservations === null ||
      practiceReservations === null);

  // Date and Time formatting
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
    <div className="flex min-h-screen w-full flex-col bg-slate-950 p-3 text-foreground lg:p-5">
      {/* Top Signage Status Bar */}
      <header className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-divider/40 bg-content1/60 px-4 py-2.5 backdrop-blur-md lg:mb-4 lg:px-6">
        {/* Left: Branding & Mode */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20 text-primary">
              <Icon className="text-2xl" icon="solar:tv-bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-foreground lg:text-xl">
                  待機場案内モニター
                </h1>
                {isDemo ? (
                  <Chip
                    className="font-black text-amber-950"
                    color="warning"
                    size="sm"
                    variant="solid"
                  >
                    DEMO表示中
                  </Chip>
                ) : (
                  <Chip
                    className="animate-pulse font-black text-white"
                    color="success"
                    size="sm"
                    variant="shadow"
                  >
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-white" />
                      LIVE
                    </span>
                  </Chip>
                )}
              </div>
              <p className="text-xs font-semibold text-default-400">
                {checkType === "check1"
                  ? "【前日】計量計測1 ・ テストラン赤/青 ・ 試走場"
                  : "【当日】計量計測2 ・ テストラン赤/青 ・ 試走場"}
              </p>
            </div>
          </div>
        </div>

        {/* Center: Day Switcher & Demo Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Day Switcher Tabs */}
          <div className="flex items-center rounded-xl bg-background/80 p-1 shadow-inner">
            <Link
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                checkType === "check1"
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-default-500 hover:text-foreground"
              }`}
              href={`/display/waiting/check1${isDemo ? "?demo=1" : ""}`}
            >
              前日（計量1）
            </Link>
            <Link
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                checkType === "check2"
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-default-500 hover:text-foreground"
              }`}
              href={`/display/waiting/check2${isDemo ? "?demo=1" : ""}`}
            >
              当日（計量2）
            </Link>
          </div>

          {/* Demo Toggle Button */}
          <Button
            className="text-xs font-bold"
            color={isDemo ? "warning" : "default"}
            size="sm"
            startContent={
              <Icon
                className="text-base"
                icon={
                  isDemo ? "solar:eye-closed-linear" : "solar:play-circle-bold"
                }
              />
            }
            variant={isDemo ? "flat" : "bordered"}
            onPress={() => setIsDemo((prev) => !prev)}
          >
            {isDemo ? "本番データに戻す" : "サンプルチーム表示"}
          </Button>
        </div>

        {/* Right: Clock & Fullscreen */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs font-semibold text-default-400">
              {formattedDate}
            </div>
            <div className="font-mono text-2xl font-black tracking-wider text-primary lg:text-3xl">
              {formattedTime}
            </div>
          </div>

          <Tooltip content={isFullscreen ? "全画面解除" : "全画面表示"}>
            <Button
              isIconOnly
              aria-label="Toggle Fullscreen"
              className="rounded-xl border border-divider/40 bg-content2/50"
              size="sm"
              variant="flat"
              onPress={toggleFullscreen}
            >
              <Icon
                className="text-lg"
                icon={
                  isFullscreen
                    ? "solar:minimize-square-3-bold"
                    : "solar:maximize-square-3-bold"
                }
              />
            </Button>
          </Tooltip>
        </div>
      </header>

      {/* Demo Scenario Bar (when in demo mode) */}
      {isDemo && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-amber-950/20 px-4 py-2 text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <Icon
              className="text-base text-amber-400"
              icon="solar:info-circle-bold"
            />
            <span>
              <strong>【サンプル動作プレビュー中】</strong>{" "}
              チームが予約・呼出された時の実際の表示例です。
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-amber-400">シナリオ切替:</span>
            <Button
              className="h-6 px-2 text-[11px] font-bold"
              color={demoScenario === "standard" ? "warning" : "default"}
              size="sm"
              variant={demoScenario === "standard" ? "solid" : "flat"}
              onPress={() => setDemoScenario("standard")}
            >
              標準（呼出中あり）
            </Button>
            <Button
              className="h-6 px-2 text-[11px] font-bold"
              color={demoScenario === "heavy" ? "warning" : "default"}
              size="sm"
              variant={demoScenario === "heavy" ? "solid" : "flat"}
              onPress={() => setDemoScenario("heavy")}
            >
              待機多数
            </Button>
            <Button
              className="h-6 px-2 text-[11px] font-bold"
              color={demoScenario === "idle" ? "warning" : "default"}
              size="sm"
              variant={demoScenario === "idle" ? "solid" : "flat"}
              onPress={() => setDemoScenario("idle")}
            >
              待機なし
            </Button>
          </div>
        </div>
      )}

      {/* Main Grid: 4 Cards */}
      <main className="flex-1">
        {isLoading ? (
          <div className="flex h-[75vh] w-full flex-col items-center justify-center gap-4">
            <Spinner color="primary" size="lg" />
            <p className="text-base font-bold text-default-400">
              予約状況を受信中...
            </p>
          </div>
        ) : (
          <div className="grid h-full grid-cols-1 gap-3.5 sm:grid-cols-2 lg:gap-4 xl:grid-cols-4">
            <WaitingCard {...checkCardData} />
            <WaitingCard {...testrunRedData} />
            <WaitingCard {...testrunBlueData} />
            <WaitingCard {...practiceData} />
          </div>
        )}
      </main>
    </div>
  );
}
