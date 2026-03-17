import Link from "next/link";

export default function NotFound() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 text-2xl">
          ⚠
        </div>
        <h1 className="text-2xl font-bold text-gray-800">チームが見つかりません</h1>
        <p className="mt-3 text-gray-600">
          指定されたチームは存在しないか、削除された可能性があります。
        </p>
        <div className="mt-5">
          <Link className="text-sm font-medium text-primary underline" href="/settings/users">
            ユーザー設定へ戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
