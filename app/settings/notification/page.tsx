"use client";

import {
  settingsPageSubtitle,
  settingsPageTitle,
} from "@/components/settings/styles";
import SlackNotificationButton from "@/components/settings/slack-notification-button";
import SlackChannelIdButton from "@/components/settings/slack-channel-id-button";
import SlackChannelCreateButton from "@/components/settings/slack-channel-create-button";
import SlackChannelDeleteButton from "@/components/settings/slack-channel-delete-button";
import SystemChannelIdButton from "@/components/settings/system-channel-id-button";
import VoiceNotificationSettings from "@/components/settings/voice-notification-settings";
import { useAuth } from "@/lib/contexts/AuthContext";

export default function Page() {
  const { isAdmin } = useAuth();

  return (
    <div className="space-y-6">
      {/* 案内モニター音声呼出設定 */}
      <div className="p-2">
        <p className={settingsPageTitle()}>案内モニター音声呼出設定</p>
        <p className={settingsPageSubtitle()}>
          待機場案内モニターおよび試合案内画面で「呼出中」になった際のアナウンス音量を設定・テストできます。
        </p>
        <VoiceNotificationSettings />
      </div>

      <div className="p-2">
        <p className={settingsPageTitle()}>Slack通知設定</p>
        <p className={settingsPageSubtitle()}>
          Slackへのテスト通知のみ送信できます．
        </p>
        <div className="mt-4">
          <SlackNotificationButton />
        </div>
      </div>
      {isAdmin && (
        <div className="p-2">
          <p className={settingsPageTitle()}>Slack設定</p>
          <p className={settingsPageSubtitle()}>
            全ユーザーのSlackチャンネルを作成し、チャンネルIDをFirebaseに保存します。
          </p>
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium">チャンネル作成</p>
              <SlackChannelCreateButton />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">チャンネル削除</p>
              <SlackChannelDeleteButton />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">チャンネルID取得</p>
              <SlackChannelIdButton />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">
                システムチャンネルID取得
              </p>
              <SystemChannelIdButton />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
