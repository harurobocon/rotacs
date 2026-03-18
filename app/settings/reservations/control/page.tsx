"use client";

import "client-only";

import React, { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  Accordion,
  AccordionItem,
  Button,
  Card,
  CardBody,
  CardHeader,
  Checkbox,
  Input,
  Radio,
  RadioGroup,
  Snippet,
} from "@heroui/react";

import { getReservationSettingsWithFallbackInfo } from "@/lib/client/settings";
import { updateReservationSettings } from "@/lib/server/settings";
import {
  RESERVATION_TYPES,
  DEFAULT_RESERVATION_GLOBAL_SETTINGS,
  ReservationSettings,
  ReservationConditionFallbackMap,
  ReservationType,
  ReservationControlMode,
  resolveAdminBypassEnabled,
  resolveConditionEnabled,
} from "@/types/settings";
import { ActionResult } from "@/types/actions";
import { AuthGuard } from "@/components/AuthGuard";

const initialState: ActionResult = {
  errors: "",
};

const reservationTypeToDisplayName: Record<ReservationType, string> = {
  check1: "計量計測1（前日）",
  check2: "計量計測2（当日）",
  practice: "試走場",
  testrun: "テストラン",
};

interface LogicFile {
  key: "preventDuplicateReservation" | "requireCheck1Pass";
  path: string;
  rawUrl: string;
  blobUrl: string;
  code: string;
  startLine: number;
  endLine: number;
  error?: string;
}

interface LogicApiResponse {
  commitSha: string;
  snippetsByType: Record<ReservationType, Record<LogicFile["key"], LogicFile>>;
}

const conditionLabelMap: Record<LogicFile["key"], string> = {
  preventDuplicateReservation: "二重予約を防ぐ",
  requireCheck1Pass: "計量計測1の合格を必須にする",
};

function ConditionSnippetAccordion({
  snippet,
  disabled,
}: {
  snippet?: LogicFile;
  disabled?: boolean;
}) {
  if (!snippet) {
    return (
      <p className="text-xs text-default-500">
        ロジックスニペットを読み込んでいます...
      </p>
    );
  }

  return (
    <Accordion isCompact>
      <AccordionItem
        key={snippet.key}
        isDisabled={disabled}
        subtitle={
          disabled
            ? "この予約種別では適用されません"
            : `${snippet.path}:${snippet.startLine}-${snippet.endLine}`
        }
        title="対応ロジックを表示"
      >
        <div className="flex flex-col gap-2 text-xs">
          <div className="flex flex-col gap-1">
            <a
              className="text-primary underline"
              href={snippet.blobUrl}
              rel="noreferrer"
              target="_blank"
            >
              GitHubで確認
            </a>
            <a
              className="text-default-500 underline"
              href={snippet.rawUrl}
              rel="noreferrer"
              target="_blank"
            >
              Rawを開く
            </a>
          </div>
          {snippet.error ? (
            <p className="text-danger">{snippet.error}</p>
          ) : (
            <pre className="max-h-72 overflow-auto rounded-small bg-default-100 p-3 text-xs">
              <code>{snippet.code}</code>
            </pre>
          )}
        </div>
      </AccordionItem>
    </Accordion>
  );
}

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
  const [fallbackMap, setFallbackMap] =
    useState<ReservationConditionFallbackMap | null>(null);
  const [globalFallback, setGlobalFallback] = useState(false);
  const [logicData, setLogicData] = useState<LogicApiResponse | null>(null);
  const [logicError, setLogicError] = useState<string | null>(null);
  const [formState, formAction] = useFormState(
    updateReservationSettings,
    initialState,
  );

  useEffect(() => {
    getReservationSettingsWithFallbackInfo().then((result) => {
      setSettings(result.settings);
      setFallbackMap(result.fallbackMap);
      setGlobalFallback(result.globalFallback);
    });
  }, []);

  useEffect(() => {
    fetch("/api/settings/reservation-logic")
      .then(async (res) => {
        if (!res.ok) {
          const payload = await res.json();

          throw new Error(payload?.error || "ロジックの取得に失敗しました");
        }

        return res.json();
      })
      .then((payload: LogicApiResponse) => {
        setLogicData(payload);
      })
      .catch((error: Error) => {
        setLogicError(error.message);
      });
  }, []);

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

  const handleConditionChange = (
    type: ReservationType,
    key: "preventDuplicateReservation" | "requireCheck1Pass",
    value: boolean,
  ) => {
    if (settings) {
      setSettings({
        ...settings,
        [type]: {
          ...settings[type],
          conditions: {
            ...settings[type].conditions,
            [key]: value,
          },
        },
      });
    }

    if (fallbackMap) {
      setFallbackMap({
        ...fallbackMap,
        [type]: {
          ...fallbackMap[type],
          [key]: false,
        },
      });
    }
  };

  if (!settings) {
    return <div>読み込み中...</div>;
  }

  return (
    <AuthGuard requireAdmin>
      <div className="flex h-full w-full flex-col items-center gap-4 p-4">
        <h1 className="text-2xl font-bold">予約受付設定</h1>
        <form action={formAction} className="w-full max-w-2xl">
          {formState.errors && (
            <Snippet className="mb-4" color="danger">
              {formState.errors}
            </Snippet>
          )}
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">共通設定</h2>
              </CardHeader>
              <CardBody>
                <div className="rounded-small border border-default-100 p-2">
                  <Checkbox
                    isSelected={resolveAdminBypassEnabled(
                      settings.global?.adminBypassEnabled,
                    )}
                    onValueChange={(v) => {
                      setGlobalFallback(false);
                      setSettings((prev) => {
                        if (!prev) {
                          return prev;
                        }

                        return {
                          ...prev,
                          global: {
                            ...(prev.global ??
                              DEFAULT_RESERVATION_GLOBAL_SETTINGS),
                            adminBypassEnabled: v,
                          },
                        };
                      });
                    }}
                  >
                    adminが予約条件をバイパスする
                  </Checkbox>
                  <input
                    name="global-adminBypassEnabled"
                    type="hidden"
                    value={String(
                      resolveAdminBypassEnabled(
                        settings.global?.adminBypassEnabled,
                      ),
                    )}
                  />
                  {globalFallback && (
                    <p className="mt-1 text-xs text-warning">
                      Firestore値がnullまたは未設定のため、有効として扱っています。
                    </p>
                  )}
                </div>
              </CardBody>
            </Card>
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
                      isDisabled={settings[type].mode !== "timer"}
                      label="開始日 (JST)"
                      name={`${type}-startDate`}
                      type="date"
                      value={settings[type].startDate}
                      onChange={(e) =>
                        handleSettingChange(type, "startDate", e.target.value)
                      }
                    />
                    <Input
                      isDisabled={settings[type].mode !== "timer"}
                      label="開始時間 (JST)"
                      name={`${type}-startTime`}
                      type="time"
                      value={settings[type].startTime}
                      onChange={(e) =>
                        handleSettingChange(type, "startTime", e.target.value)
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-3 rounded-medium border border-default-200 p-3">
                    <p className="text-sm font-semibold">予約可能条件</p>
                    {(type === "check1"
                      ? (["preventDuplicateReservation"] as const)
                      : ([
                          "preventDuplicateReservation",
                          "requireCheck1Pass",
                        ] as const)
                    ).map((conditionKey) => {
                      const isRequireCheck1Pass =
                        conditionKey === "requireCheck1Pass";
                      const isDisabled = false;
                      const snippet =
                        logicData?.snippetsByType?.[type]?.[conditionKey];
                      const conditionValue = resolveConditionEnabled(
                        conditionKey,
                        settings[type].conditions?.[conditionKey],
                      );
                      const showFallback =
                        fallbackMap?.[type]?.[conditionKey] ?? false;

                      return (
                        <div
                          key={`${type}-${conditionKey}`}
                          className="rounded-small border border-default-100 p-2"
                        >
                          <Checkbox
                            isDisabled={isDisabled}
                            isSelected={conditionValue}
                            onValueChange={(v) =>
                              handleConditionChange(type, conditionKey, v)
                            }
                          >
                            {conditionLabelMap[conditionKey]}
                          </Checkbox>
                          <input
                            name={`${type}-${conditionKey}`}
                            type="hidden"
                            value={String(conditionValue)}
                          />
                          {showFallback && (
                            <p className="mt-1 text-xs text-warning">
                              Firestore値がnullまたは未設定のため、有効として扱っています。
                            </p>
                          )}
                          <div className="pt-1">
                            <ConditionSnippetAccordion
                              disabled={isDisabled}
                              snippet={snippet}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
          <SubmitButton />
        </form>
        {logicError && (
          <Snippet className="w-full max-w-2xl" color="danger">
            {logicError}
          </Snippet>
        )}
      </div>
    </AuthGuard>
  );
}
