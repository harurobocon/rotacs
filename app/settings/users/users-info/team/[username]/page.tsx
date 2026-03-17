import "server-cli-only";

import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AuthGuard } from "@/components/AuthGuard";
import { getAllFirestoreUsers } from "@/lib/server/firestoreUserHelpers";

export const dynamic = "force-dynamic";

type TeamPageProps = {
  params: {
    username: string;
  };
};

function generateQRCodeURL(url: string): string {
  const encodedURL = encodeURIComponent(url);

  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedURL}`;
}

export default async function TeamPage({ params }: TeamPageProps) {
  const username = decodeURIComponent(params.username);
  const users = await getAllFirestoreUsers();
  const team = users.find((user) => user.role === "user" && user.username === username);
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN;
  const targetUrl = appDomain ? `https://${appDomain}` : "https://rotacs.yuchi.jp";

  if (!team) {
    notFound();
  }

  const qrCodeURL = generateQRCodeURL(targetUrl);

  return (
    <AuthGuard requireAdmin requireAuth>
      <div className="fixed inset-0 z-50 overflow-auto bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="mx-auto max-w-4xl py-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <nav aria-label="breadcrumb" className="text-sm text-gray-600">
              <ol className="flex items-center gap-2">
                <li>
                  <Link className="font-medium text-blue-700 hover:underline" href="/settings/users/users-info">
                    チーム一覧
                  </Link>
                </li>
                <li aria-hidden="true" className="text-gray-400">
                  /
                </li>
                <li aria-current="page" className="font-semibold text-gray-800">
                  {team.display_name}
                </li>
              </ol>
            </nav>

            <Link
              className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
              href="/settings/users"
            >
              ユーザー設定へ戻る
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl bg-white shadow-lg">
              <div className="rounded-t-xl bg-blue-600 px-6 py-4 text-white">
                <h1 className="text-2xl font-bold">{team.display_name}</h1>
              </div>
              <div className="space-y-4 p-6">
                <div className="rounded-lg bg-gray-50 p-3">
                  <div className="text-sm font-medium text-gray-600">ユーザー名</div>
                  <div className="text-lg font-mono">{team.username}</div>
                </div>

                <div className="rounded-lg bg-gray-50 p-3">
                  <div className="text-sm font-medium text-gray-600">パスワード</div>
                  <div className="text-lg font-mono">{team.plain_password ?? "未設定"}</div>
                </div>

                <div className="rounded-lg bg-gray-50 p-3">
                  <div className="text-sm font-medium text-gray-600">ピット番号</div>
                  <div className="text-lg font-bold">{team.pit_number}</div>
                </div>

                <div className="rounded-lg bg-gray-50 p-3">
                  <div className="text-sm font-medium text-gray-600">ピットサイド</div>
                  <div className="text-lg">{team.pit_side}</div>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white shadow-lg">
              <div className="rounded-t-xl bg-green-600 px-6 py-4 text-white">
                <h2 className="text-center text-xl font-bold">QRコード</h2>
              </div>
              <div className="space-y-4 p-6 text-center">
                <div className="flex justify-center">
                  <div className="rounded-lg bg-white p-4 shadow-inner">
                    <img
                      alt={`QR Code for ${targetUrl}`}
                      className="mx-auto"
                      height={200}
                      src={qrCodeURL}
                      width={200}
                    />
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  <p className="font-medium">スキャンしてアクセス:</p>
                  <p className="break-all font-mono text-blue-600">{targetUrl}</p>
                </div>
                <div className="text-xs text-gray-500">
                  QRコードをスマートフォンでスキャンしてください
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-xl bg-white p-6 shadow-lg">
            <div className="grid gap-4 text-sm text-gray-600 md:grid-cols-2">
              <div>
                <span className="font-medium">役割:</span> {team.role}
              </div>
              <div>
                <span className="font-medium">チーム名:</span> {team.display_name}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
