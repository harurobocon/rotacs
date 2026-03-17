"use client";

import { useState, useEffect } from "react";

import { listenReservationSettings } from "@/lib/client/settings";
import { ReservationType, ReservationControlSetting } from "@/types/settings";

function getJstDate() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const jstOffset = 9 * 60 * 60000;

  return new Date(utc + jstOffset);
}

export function useReservationControl(reservationType: ReservationType) {
  const [isDisabled, setIsDisabled] = useState(true);
  const [message, setMessage] = useState<string | null>(
    "設定を読み込んでいます...",
  );
  const [setting, setSetting] = useState<ReservationControlSetting | null>(
    null,
  );

  useEffect(() => {
    const unsubscribe = listenReservationSettings((settings) => {
      setSetting(settings[reservationType]);
    });

    return () => unsubscribe();
  }, [reservationType]);

  useEffect(() => {
    if (!setting) {
      setIsDisabled(true);
      setMessage("設定を読み込んでいます...");

      return;
    }

    const checkStatus = () => {
      switch (setting.mode) {
        case "enabled":
          setIsDisabled(false);
          setMessage(null);
          break;
        case "disabled":
          setIsDisabled(true);
          setMessage("現在予約受付を停止しています");
          break;
        case "timer":
          {
            const jstNow = getJstDate();
            const startDateTime = new Date(
              `${setting.startDate}T${setting.startTime}:00+09:00`,
            );

            if (jstNow < startDateTime) {
              setIsDisabled(true);
              setMessage(
                `予約受付は${setting.startDate} ${setting.startTime}から開始します`,
              );
            } else {
              setIsDisabled(false);
              setMessage(null);
            }
          }
          break;
        default:
          setIsDisabled(true);
          setMessage("現在予約受付を停止しています");
      }
    };

    checkStatus();

    // タイマーモードの場合、定期的にチェック
    const intervalId =
      setting.mode === "timer" ? setInterval(checkStatus, 1000) : undefined;

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [setting]);

  return { isDisabled, message };
}
