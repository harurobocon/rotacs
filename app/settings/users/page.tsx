import "server-cli-only";

import React from "react";
import { User as LuciaUser } from "lucia";

import UserSettingsTable from "@/components/settings/user-table";
import { db } from "@/lib/server/db";
import NewUsersTextarea from "@/components/settings/new-users-textarea";
import {
  settingsPageSubtitle,
  settingsPageTitle,
} from "@/components/settings/styles";

export default async function UserSettings() {
  const users: LuciaUser[] = await db.selectFrom("user").selectAll().execute();

  return (
    <div>
      <div className="p-2">
        <p className={settingsPageTitle()}>ユーザー一覧</p>
        <p className={settingsPageSubtitle()}>ユーザーの削除を行えます．</p>
        <UserSettingsTable users={users} />
      </div>
      <div className="p-2">
        <p className={settingsPageTitle()}>ユーザーの追加</p>
        <p className={settingsPageSubtitle()}>
          CSV形式でユーザーを追加できます．
        </p>
        <NewUsersTextarea />
      </div>
    </div>
  );
}
