"use client";

import "client-only";

import React from "react";
import {
  Accordion,
  AccordionItem,
  button as buttonStyle,
  Divider,
  Link,
  Spinner,
} from "@heroui/react";
import { Icon } from "@iconify/react";

import { getCheckSchedule, onCheckCollectionChange } from "@/lib/client/check";
import {
  pageContainer,
  pageSubtitle,
  pageTitle,
} from "@/components/primitives";
import CheckReservationCard from "@/components/check-reservation-card";
import {
  CHECK2_COLLECTION,
  CheckSchedule,
  CheckSide,
  CheckStatus,
  getCheckSides,
} from "@/types/check";
import {
  getCheckLocationSettings,
  listenCheckLocationSettings,
} from "@/lib/client/settings";
import { CheckLocationMode } from "@/types/settings";

export default function Check() {
  const [schedule, setSchedule] = React.useState<CheckSchedule | undefined>(
    undefined,
  );
  const [sides, setSides] = React.useState<CheckSide[]>(["ピット"]);
  const [mode, setMode] = React.useState<CheckLocationMode>("single");

  React.useEffect(() => {
    // 計量計測モード設定を取得
    getCheckLocationSettings().then((settings) => {
      const currentMode = settings.check2;

      setMode(currentMode);
      setSides(getCheckSides(currentMode));

      // モード設定後にスケジュールを取得
      getCheckSchedule(CHECK2_COLLECTION, currentMode).then((_newSchedule) => {
        const newSchedule = new CheckSchedule(_newSchedule);

        setSchedule(newSchedule);
      });
    });

    // モード設定の変更をリスニング
    const unsubscribeSettings = listenCheckLocationSettings((settings) => {
      const currentMode = settings.check2;

      setMode(currentMode);
      setSides(getCheckSides(currentMode));

      // モード変更時にスケジュールを再取得
      getCheckSchedule(CHECK2_COLLECTION, currentMode).then((_newSchedule) => {
        const newSchedule = new CheckSchedule(_newSchedule);

        setSchedule(newSchedule);
      });
    });

    const unsubscribeSchedule = onCheckCollectionChange(
      CHECK2_COLLECTION,
      (_) => {
        // 現在のモードを使用してスケジュールを更新
        getCheckLocationSettings().then((settings) => {
          getCheckSchedule(CHECK2_COLLECTION, settings.check2).then(
            (_newSchedule) => {
              const newSchedule = new CheckSchedule(_newSchedule);

              setSchedule(newSchedule);
            },
          );
        });
      },
    );

    return () => {
      unsubscribeSettings();
      unsubscribeSchedule();
    };
  }, []);

  const statusOrder: CheckStatus[] = [
    "再検査",
    "合格",
    "実施中",
    "移動中",
    "呼出中",
    "順番待ち",
    "キャンセル",
  ];

  function getBgColor(side: CheckSide, _status: CheckStatus) {
    if (mode === "dual") {
      return side === "東" ? "bg-warning-50" : "bg-success-50";
    }

    return "bg-warning-50";
  }

  const scheduleView =
    schedule === undefined ? (
      <Spinner className="flex py-4" label="読み込み中..." />
    ) : (
      <Accordion
        defaultExpandedKeys={["実施中", "移動中", "呼出中", "順番待ち"]}
        selectionMode="multiple"
      >
        {statusOrder.map((status) => (
          <AccordionItem
            key={status}
            aria-label={status}
            title={
              <span className="block w-full text-center text-xl font-bold text-default-700">
                {status}
              </span>
            }
          >
            <div
              key={`${status}-items`}
              className={`my-4 grid gap-4 md:gap-8 ${
                mode === "dual" ? "grid-cols-2" : "grid-cols-1"
              }`}
            >
              {sides.map((side) => (
                <div
                  key={side}
                  className="grid grid-cols-1 place-content-start gap-4"
                >
                  {schedule.get(side, status).map((r) => (
                    <CheckReservationCard
                      key={r}
                      bgColor={getBgColor(side, status)}
                      collectionId={CHECK2_COLLECTION}
                      reservationId={r}
                    />
                  ))}
                </div>
              ))}
            </div>
          </AccordionItem>
        ))}
      </Accordion>
    );

  return (
    <div className={pageContainer()}>
      {/* Title */}
      <div className="flex-col items-stretch">
        <h1 className={pageTitle()}>計量計測2（当日）</h1>
        <h2 className={pageSubtitle()}>
          表示順の上から下に向かって計量計測を実施していきます．
        </h2>
        <div className="my-4 flex items-stretch justify-start">
          <Link
            className={buttonStyle({
              color: "success",
            })}
            href="/check2/new"
          >
            <Icon icon="mdi:plus" />
            計量計測を予約する
          </Link>
        </div>
        <Divider />
        {scheduleView}
      </div>
    </div>
  );
}
