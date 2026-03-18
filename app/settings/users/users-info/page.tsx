import "server-cli-only";

import React from "react";
import Link from "next/link";
import { Button } from "@heroui/react";

import { AuthGuard } from "@/components/AuthGuard";
import { getAllFirestoreUsers } from "@/lib/server/firestoreUserHelpers";

export const dynamic = "force-dynamic";

export default async function UsersInfoPage() {
  const firestoreUsers = await getAllFirestoreUsers();
  const teamUsers = firestoreUsers
    .filter((user) => user.role === "user")
    .sort((a, b) => {
      if (a.pit_number === b.pit_number) {
        return a.pit_side.localeCompare(b.pit_side, "ja");
      }

      return a.pit_number - b.pit_number;
    });

  return (
    <AuthGuard requireAdmin requireAuth>
      <div className="fixed inset-0 z-50 overflow-auto bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col justify-center py-10">
          <div className="mb-4">
            <Link
              className="text-sm font-medium text-primary underline"
              href="/settings/users"
            >
              ユーザー設定へ戻る
            </Link>
          </div>

          <div className="rounded-xl border border-default-200 bg-background p-6 shadow-lg">
            <h1 className="text-3xl font-bold text-gray-800">
              チーム情報システム
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              チームを選択して詳細情報を表示
            </p>

            <div className="mt-6 space-y-3">
              {teamUsers.map((team) => (
                <Link
                  key={team.id}
                  href={`/settings/users/users-info/team/${encodeURIComponent(team.username)}`}
                >
                  <Button
                    className="mb-2 h-auto w-full justify-between py-3"
                    variant="flat"
                  >
                    <span className="text-left">{team.display_name}</span>
                    <span className="text-xs text-default-500">
                      {team.pit_side} / ピット{team.pit_number}
                    </span>
                  </Button>
                </Link>
              ))}
            </div>

            <p className="mt-6 text-center text-sm text-gray-500">
              {teamUsers.length} チームが登録されています
            </p>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
