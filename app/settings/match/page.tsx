import "server-cli-only";

import React from "react";
import { getAllMatches } from "@/lib/server/match";
import ImportHpMatches from "@/components/settings/import-hp-matches";
import MatchSettingsTable from "@/components/settings/match-table";
import {
  settingsPageSubtitle,
  settingsPageTitle,
} from "@/components/settings/styles";

export const dynamic = "force-dynamic";

export default async function MatchSettingsPage() {
  const matches = await getAllMatches();

  return (
    <div>
      <div className="p-2">
        <p className={settingsPageTitle()}>試合対戦表の登録・同期</p>
        <p className={settingsPageSubtitle()}>
          Homepage から最新の試合対戦表を取得して RoTACS に取り込みます．
        </p>
        <ImportHpMatches />
      </div>
      <div className="mt-6 p-2">
        <p className={settingsPageTitle()}>登録済み試合一覧 ({matches.length} 件)</p>
        <p className={settingsPageSubtitle()}>
          現在 Firestore に登録されている試合スケジュールです．
        </p>
        <MatchSettingsTable matches={matches} />
      </div>
    </div>
  );
}
