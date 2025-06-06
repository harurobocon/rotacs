"use server";

// import NotificationTable from "@/components/settings/notification-table";
import {
  settingsPageSubtitle,
  settingsPageTitle,
} from "@/components/settings/styles";
import { validateRequest } from "@/lib/server/auth";
import { getUserTokens } from "@/lib/server/line-notify";
import { LineNotifyToken } from "@/types/db";
import SlackNotificationButton from "@/components/settings/slack-notification-button";

export default async function Page() {
  const { user } = await validateRequest();

  // let tokens: LineNotifyToken[] = [];

  // if (user) {
  //   tokens = await getUserTokens(user);
  // }

  return (
    <div>
      {/* <div className="p-2">
        <p className={settingsPageTitle()}>LINE通知設定</p>
        <p className={settingsPageSubtitle()}>LINEへの通知の設定をします．</p>
        <NotificationTable tokenJson={JSON.stringify(tokens)} />
      </div> */}
      <div className="p-2">
        <p className={settingsPageTitle()}>Slack通知設定</p>
        <p className={settingsPageSubtitle()}>
          Slackへのテスト通知のみ送信できます．
        </p>
        <div className="mt-4">
          <SlackNotificationButton />
        </div>
      </div>
    </div>
  );
}
