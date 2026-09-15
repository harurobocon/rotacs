"use client";

const STORAGE_KEY_VOLUME = "rotacs_voice_volume";
const STORAGE_KEY_ENABLED = "rotacs_voice_enabled";
const VOLUME_CHANGE_EVENT = "rotacs-voice-volume-change";
const ENABLED_CHANGE_EVENT = "rotacs-voice-enabled-change";

/**
 * 現在設定されている音声読み上げ音量を取得（0.0 〜 1.0）
 */
export function getStoredVoiceVolume(): number {
  if (typeof window === "undefined") return 1.0;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_VOLUME);

    if (saved !== null) {
      const parsed = parseFloat(saved);

      if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to read voice volume from localStorage", e);
  }

  return 1.0;
}

/**
 * 音声読み上げ音量を保存し、他画面やコンポーネントに通知（0.0 〜 1.0）
 */
export function setStoredVoiceVolume(volume: number): void {
  if (typeof window === "undefined") return;
  const clamped = Math.max(0, Math.min(1, volume));

  try {
    localStorage.setItem(STORAGE_KEY_VOLUME, clamped.toString());
  } catch (e) {
    console.warn("Failed to save voice volume to localStorage", e);
  }
  window.dispatchEvent(
    new CustomEvent(VOLUME_CHANGE_EVENT, { detail: clamped }),
  );
}

/**
 * 音声案内の有効/無効状態を取得
 */
export function getStoredVoiceEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ENABLED);

    if (saved !== null) {
      return saved === "true";
    }
  } catch (e) {
    console.warn("Failed to read voice enabled from localStorage", e);
  }

  return true;
}

/**
 * 音声案内の有効/無効状態を保存
 */
export function setStoredVoiceEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_ENABLED, enabled ? "true" : "false");
  } catch (e) {
    console.warn("Failed to save voice enabled to localStorage", e);
  }
  window.dispatchEvent(
    new CustomEvent(ENABLED_CHANGE_EVENT, { detail: enabled }),
  );
  if (!enabled && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}

/**
 * 日本語音声（ja-JP）を取得
 */
function getJapaneseVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return null;
  }
  const voices = window.speechSynthesis.getVoices();
  const jaVoices = voices.filter(
    (v) => v.lang === "ja-JP" || v.lang === "ja_JP" || v.lang.startsWith("ja"),
  );

  if (jaVoices.length === 0) return null;

  // Google 日本語や自然な音声を優先
  const preferred = jaVoices.find(
    (v) =>
      v.name.includes("Google") ||
      v.name.includes("Kyoko") ||
      v.name.includes("Otoya") ||
      v.name.includes("Haruka") ||
      v.name.includes("Sayaka") ||
      v.name.includes("Natural"),
  );

  return preferred || jaVoices[0];
}

/**
 * 読み上げテキストを生成
 */
export function formatCallingAnnouncement(
  pitNumber: number | null | undefined,
  teamName: string,
): string {
  if (pitNumber !== null && pitNumber !== undefined && pitNumber > 0) {
    return `チーム${pitNumber} 移動してください`;
  }
  const trimmed = teamName.trim();

  if (trimmed) {
    return `${trimmed} 移動してください`;
  }

  return "移動してください";
}

/**
 * Web Speech API を使ってテキストを直接発話
 */
export function speakText(
  text: string,
  options?: { volume?: number; onEnd?: () => void; onError?: () => void },
): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    console.warn("Web Speech API is not supported in this environment");

    return false;
  }

  try {
    const volume =
      options?.volume !== undefined ? options.volume : getStoredVoiceVolume();

    // 音量が0の場合はスキップ
    if (volume <= 0) {
      options?.onEnd?.();

      return true;
    }

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.lang = "ja-JP";
    utterance.volume = Math.max(0, Math.min(1, volume));
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const voice = getJapaneseVoice();

    if (voice) {
      utterance.voice = voice;
    }

    if (options?.onEnd) {
      utterance.onend = () => options.onEnd?.();
    }
    if (options?.onError) {
      utterance.onerror = () => options.onError?.();
    }

    window.speechSynthesis.speak(utterance);

    return true;
  } catch (error) {
    console.error("speechSynthesis error:", error);
    options?.onError?.();

    return false;
  }
}

/**
 * 呼び出し中チームのアナウンスを実行
 */
export function speakCallingTeam(
  pitNumber: number | null | undefined,
  teamName: string,
  volume?: number,
): boolean {
  const text = formatCallingAnnouncement(pitNumber, teamName);

  return speakText(text, { volume });
}

/**
 * 音声テストを実行（「チーム1 移動してください」を発話）
 */
export function testVoiceAnnouncement(
  volume?: number,
  onEnd?: () => void,
): boolean {
  return speakText("チーム1 移動してください", { volume, onEnd });
}
