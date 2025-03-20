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

import {
  getPracticeSchedule,
  onPracticeCollectionChange,
} from "@/lib/client/practice";
import {
  pageContainer,
  pageSubtitle,
  pageTitle,
} from "@/components/primitives";
import PracticeReservationCard from "@/components/practice-reservation-card";
import {
  PracticeSchedule,
  PracticeStatus,
  PracticeStatuses,
} from "@/types/practice";

export default function Practice() {
  const [schedule, setSchedule] = React.useState<PracticeSchedule | undefined>(
    undefined,
  );

  React.useEffect(() => {
    getPracticeSchedule().then((_newSchedule) => {
      const newSchedule = new PracticeSchedule(_newSchedule);

      setSchedule(newSchedule);
    });

    return onPracticeCollectionChange((_) => {
      getPracticeSchedule().then((_newSchedule) => {
        const newSchedule = new PracticeSchedule(_newSchedule);

        setSchedule(newSchedule);
      });
    });
  }, []);

  const statusOrder: PracticeStatus[] = [
    "終了",
    "実施中",
    "移動中",
    "呼出中",
    "順番待ち",
    "キャンセル",
  ];

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
              className="my-4 grid grid-cols-1 gap-4 md:gap-8"
            >
              <div className="grid grid-cols-1 place-content-start gap-4">
                {schedule.get("default", status).map((r) => (
                  <PracticeReservationCard
                    key={r}
                    bgColor="bg-success-50"
                    reservationId={r}
                  />
                ))}
              </div>
            </div>
          </AccordionItem>
        ))}
      </Accordion>
    );

  return (
    <div className={pageContainer()}>
      {/* Title */}
      <div className="flex-col items-stretch">
        <h1 className={pageTitle()}>試走場予約</h1>
        <h2 className={pageSubtitle()}>
          表示順の上から下に向かって試走を実施していきます．
        </h2>
        <div className="my-4 flex items-stretch justify-start">
          <Link
            className={buttonStyle({
              color: "success",
            })}
            href="/practice/new"
          >
            <Icon icon="mdi:plus" />
            試走場を予約する
          </Link>
        </div>
        <Divider />
        {scheduleView}
      </div>
    </div>
  );
}
