"use client";

import React, { useEffect, useState, useTransition } from "react";
import { Button, Card, CardBody, Slider } from "@heroui/react";
import { Icon } from "@iconify/react";

import {
  getStoredVoiceVolume,
  setStoredVoiceVolume,
  testVoiceAnnouncement,
} from "@/lib/client/voice-announcement";
import { getDisplaySettings } from "@/lib/client/settings";
import { updateVoiceVolume } from "@/lib/server/settings";
import { useAuth } from "@/lib/contexts/AuthContext";

export default function VoiceNotificationSettings() {
  const { isAdmin } = useAuth();
  const [volumePercent, setVolumePercent] = useState<number>(100);
  const [isPlayingTest, setIsPlayingTest] = useState<boolean>(false);
  const [, startTransition] = useTransition();

  // 初期値の読み込み
  useEffect(() => {
    // まずローカルストレージから取得
    const localVol = getStoredVoiceVolume();

    setVolumePercent(Math.round(localVol * 100));

    // Firestore設定からも取得して最新化
    getDisplaySettings()
      .then((settings) => {
        if (
          settings.voiceVolume !== undefined &&
          typeof settings.voiceVolume === "number"
        ) {
          const percent = Math.round(settings.voiceVolume * 100);

          setVolumePercent(percent);
          setStoredVoiceVolume(settings.voiceVolume);
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch display settings for voice volume", err);
      });
  }, []);

  // スライダー操作中（リアルタイムにローカル反映）
  const handleVolumeChange = (value: number | number[]) => {
    const val = Array.isArray(value) ? value[0] : value;

    setVolumePercent(val);
    setStoredVoiceVolume(val / 100);
  };

  // スライダー操作完了時（Firestoreに保存）
  const handleVolumeChangeEnd = (value: number | number[]) => {
    const val = Array.isArray(value) ? value[0] : value;
    const volRatio = val / 100;

    setStoredVoiceVolume(volRatio);

    if (isAdmin) {
      startTransition(async () => {
        try {
          await updateVoiceVolume(volRatio);
        } catch (e) {
          console.error("Failed to update voice volume in Firestore", e);
        }
      });
    }
  };

  // 音声テスト発声
  const handleTestVoice = () => {
    setIsPlayingTest(true);
    const success = testVoiceAnnouncement(volumePercent / 100, () => {
      setIsPlayingTest(false);
    });

    if (!success) {
      setIsPlayingTest(false);
    } else {
      // フォールバックタイマー（onEndが発火しない環境用）
      setTimeout(() => {
        setIsPlayingTest(false);
      }, 3000);
    }
  };

  // 音量アイコンの選定
  const getVolumeIcon = () => {
    if (volumePercent === 0) return "solar:volume-cross-bold";
    if (volumePercent < 50) return "solar:volume-small-bold";

    return "solar:volume-loud-bold";
  };

  return (
    <Card className="mt-4 border border-default-200 bg-white/70 shadow-sm dark:bg-slate-900/50">
      <CardBody className="flex flex-col gap-5 p-5">
        <div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Icon
                className="text-2xl text-primary-500"
                icon={getVolumeIcon()}
              />
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                呼出アナウンス音量
              </span>
            </div>
            <span className="font-mono text-lg font-black text-primary-600 dark:text-primary-400">
              {volumePercent}%
            </span>
          </div>
          <p className="mt-1 text-xs text-default-500">
            案内モニター（待機場案内・試合案内画面）でチームが「呼出中」になった際のアナウンス音量を設定します。
          </p>
        </div>

        {/* 音量シークバー */}
        <div className="px-1">
          <Slider
            aria-label="音声呼出音量"
            color="primary"
            endContent={
              <Icon
                className="text-lg text-default-400"
                icon="solar:volume-loud-bold"
              />
            }
            maxValue={100}
            minValue={0}
            size="md"
            startContent={
              <Icon
                className="text-lg text-default-400"
                icon="solar:volume-cross-bold"
              />
            }
            step={1}
            value={volumePercent}
            onChange={handleVolumeChange}
            onChangeEnd={handleVolumeChangeEnd}
          />
        </div>

        {/* 音声テストボタン */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-default-200 pt-3">
          <div className="text-xs text-default-500">
            テスト発声内容:{" "}
            <span className="font-bold text-default-700 dark:text-default-300">
              「チーム1 移動してください」
            </span>
          </div>
          <Button
            className="font-bold shadow-sm"
            color="primary"
            isLoading={isPlayingTest}
            size="sm"
            startContent={
              !isPlayingTest && (
                <Icon className="text-base" icon="solar:play-circle-bold" />
              )
            }
            variant="solid"
            onPress={handleTestVoice}
          >
            {isPlayingTest ? "音声再生中..." : "音声テスト"}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
