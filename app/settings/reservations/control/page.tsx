"use client";

import "client-only";

import React, { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Radio,
  RadioGroup,
  Snippet,
} from "@heroui/react";
import { redirect } from "next/navigation";

import { getReservationSettings } from "@/lib/client/settings";
import { updateReservationSettings } from "@/lib/server/settings";
import {
  RESERVATION_TYPES,
  ReservationSettings,
  ReservationType,
  ReservationControlMode,
} from "@/types/settings";
import { ActionResult } from "@/types/actions";
import { useIsAdmin } from "@/hooks/useIsAdmin";

const initialState: ActionResult = {
  errors: "",
};

const reservationTypeToDisplayName: Record<ReservationType, string> = {
  check1: "計量計測1（前日）",
  check2: "計量計測2（当日）",
  practice: "試走場",
  testrun: "テストラン",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="mt-4" color="primary" isLoading={pending} type="submit">
      保存する
    </Button>
  );
}

export default function ReservationControlPage() {
  const [settings, setSettings] = useState<ReservationSettings | null>(null);
  const { isAdmin: isAdminUser } = useIsAdmin();
  const [formState, formAction] = useFormState(
    updateReservationSettings,
    initialState,
  );

  useEffect(() => {
    if (!isAdminUser && isAdminUser !== undefined) {
      redirect("/");
    }

    getReservationSettings().then(setSettings);
  }, [isAdminUser]);

  const handleSettingChange = (
    type: ReservationType,
    key: "mode" | "startTime" | "startDate",
    value: string,
  ) => {
    if (settings) {
      setSettings({
        ...settings,
        [type]: {
          ...settings[type],
          [key]: value,
        },
      });
    }
  };

  if (!isAdminUser || !settings) {
    return <div>読み込み中...</div>;
  }

  return (
    <div className="flex h-full w-full flex-col items-center gap-4 p-4">
      <h1 className="text-2xl font-bold">予約受付設定</h1>
      <form action={formAction} className="w-full max-w-2xl">
        {formState.errors && (
          <Snippet className="mb-4" color="danger">
            {formState.errors}
          </Snippet>
        )}
        <div className="flex flex-col gap-4">
          {RESERVATION_TYPES.map((type) => (
            <Card key={type}>
              <CardHeader>
                <h2 className="text-xl font-semibold">
                  {reservationTypeToDisplayName[type]}
                </h2>
              </CardHeader>
              <CardBody className="gap-4">
                <RadioGroup
                  label="受付モード"
                  name={`${type}-mode`}
                  orientation="horizontal"
                  value={settings[type].mode}
                  onValueChange={(v) =>
                    handleSettingChange(
                      type,
                      "mode",
                      v as ReservationControlMode,
                    )
                  }
                >
                  <Radio value="disabled">無効</Radio>
                  <Radio value="enabled">有効</Radio>
                  <Radio value="timer">タイマー</Radio>
                </RadioGroup>
                <div className="flex w-full flex-row items-center gap-2">
                  <Input
                    label="開始日 (JST)"
                    name={`${type}-startDate`}
                    type="date"
                    value={settings[type].startDate}
                    onChange={(e) =>
                      handleSettingChange(type, "startDate", e.target.value)
                    }
                    isDisabled={settings[type].mode !== "timer"}
                  />
                  <Input
                    label="開始時間 (JST)"
                    name={`${type}-startTime`}
                    type="time"
                    value={settings[type].startTime}
                    onChange={(e) =>
                      handleSettingChange(type, "startTime", e.target.value)
                    }
                    isDisabled={settings[type].mode !== "timer"}
                  />
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
        <SubmitButton />
      </form>
    </div>
  );
}
