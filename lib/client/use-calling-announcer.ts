"use client";

import { useEffect, useRef, useState, useCallback } from "react";

import {
  getStoredVoiceEnabled,
  getStoredVoiceVolume,
  setStoredVoiceEnabled,
  speakCallingTeam,
} from "@/lib/client/voice-announcement";
import { listenDisplaySettings } from "@/lib/client/settings";

export interface CallingTargetItem {
  id: string;
  pitNumber?: number | null;
  teamName: string;
}

export function useCallingAnnouncer(
  callingItems: CallingTargetItem[],
  isReady: boolean = true,
) {
  const [isVoiceEnabled, setIsVoiceEnabledState] = useState<boolean>(true);
  const [volume, setVolumeState] = useState<number>(1.0);
  const knownCallingIdsRef = useRef<Set<string> | null>(null);

  // 初期化時に localStorage から設定を読み込む
  useEffect(() => {
    setIsVoiceEnabledState(getStoredVoiceEnabled());
    setVolumeState(getStoredVoiceVolume());

    // 他のタブや設定画面での変更イベントを購読
    const handleVolumeChange = (e: Event) => {
      const customEvent = e as CustomEvent<number>;

      if (typeof customEvent.detail === "number") {
        setVolumeState(customEvent.detail);
      }
    };

    const handleEnabledChange = (e: Event) => {
      const customEvent = e as CustomEvent<boolean>;

      if (typeof customEvent.detail === "boolean") {
        setIsVoiceEnabledState(customEvent.detail);
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "rotacs_voice_volume" && e.newValue !== null) {
        const val = parseFloat(e.newValue);

        if (!isNaN(val)) setVolumeState(val);
      }
      if (e.key === "rotacs_voice_enabled" && e.newValue !== null) {
        setIsVoiceEnabledState(e.newValue === "true");
      }
    };

    window.addEventListener("rotacs-voice-volume-change", handleVolumeChange);
    window.addEventListener("rotacs-voice-enabled-change", handleEnabledChange);
    window.addEventListener("storage", handleStorage);

    // Firestore DisplaySettings も購読（他端末の管理者が更新した場合の同期）
    const unsubscribeFirestore = listenDisplaySettings((settings) => {
      if (
        settings.voiceVolume !== undefined &&
        typeof settings.voiceVolume === "number"
      ) {
        setVolumeState(settings.voiceVolume);
      }
    });

    return () => {
      window.removeEventListener(
        "rotacs-voice-volume-change",
        handleVolumeChange,
      );
      window.removeEventListener(
        "rotacs-voice-enabled-change",
        handleEnabledChange,
      );
      window.removeEventListener("storage", handleStorage);
      unsubscribeFirestore();
    };
  }, []);

  // 音声ON/OFF切り替えハンドラ
  const toggleVoiceEnabled = useCallback(() => {
    setIsVoiceEnabledState((prev) => {
      const next = !prev;

      setStoredVoiceEnabled(next);

      return next;
    });
  }, []);

  // 呼び出し中アイテムの差分検知と音声アナウンス
  useEffect(() => {
    if (!isReady) return;

    const currentIds = new Set(callingItems.map((item) => item.id));

    // 初回ロード時は既存の呼出中IDを記憶するのみで発話しない
    if (knownCallingIdsRef.current === null) {
      knownCallingIdsRef.current = currentIds;

      return;
    }

    // 新しく「呼出中」に追加されたアイテムを抽出
    const newlyAddedItems = callingItems.filter(
      (item) => !knownCallingIdsRef.current!.has(item.id),
    );

    // 現在のIDセットで更新
    knownCallingIdsRef.current = currentIds;

    // 新着があり、音声案内が有効な場合に発話
    if (newlyAddedItems.length > 0 && isVoiceEnabled) {
      for (const item of newlyAddedItems) {
        speakCallingTeam(item.pitNumber, item.teamName, volume);
      }
    }
  }, [callingItems, isReady, isVoiceEnabled, volume]);

  return {
    isVoiceEnabled,
    toggleVoiceEnabled,
    volume,
  };
}
