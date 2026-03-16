import "server-cli-only";

import React from "react";

import { UserTable as LuciaUser } from "@/types/auth";
import UserSettingsTable from "@/components/settings/user-table";
import { getAllFirestoreUsers } from "@/lib/server/firestoreUserHelpers";
import NewUsersTextarea from "@/components/settings/new-users-textarea";
import {
  settingsPageSubtitle,
  settingsPageTitle,
} from "@/components/settings/styles";

export default async function UserSettings() {
  const firestoreUsers = await getAllFirestoreUsers();
  const users: LuciaUser[] = firestoreUsers.map((user) => ({
    id: user.id,
    username: user.username,
    display_name: user.display_name,
    role: user.role,
    pit_side: user.pit_side,
    pit_number: user.pit_number,
    slack_channel_id: user.slack_channel_id,
  }));

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
