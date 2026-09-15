"use client";

import React from "react";
import { Button } from "@heroui/react";
import { useFormState } from "react-dom";

import { handleSlackTestMessageSend } from "@/app/settings/notification/actions";
import { useAuth } from "@/lib/contexts/AuthContext";

const initialSlackState: { ok?: boolean; error?: string } = {};

export default function SlackNotificationButton() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [state, formAction] = useFormState(
    handleSlackTestMessageSend,
    initialSlackState,
  );

  React.useEffect(() => {
    setIsLoading(false);
  }, [state]);

  return (
    <div className="space-y-4">
      <form action={formAction} onSubmit={() => setIsLoading(true)}>
        <input name="userId" type="hidden" value={user?.uid ?? ""} />
        <Button color="primary" isLoading={isLoading} type="submit">
          Slackテスト通知
        </Button>
      </form>

      {state?.ok && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
          <div className="font-medium">✅ テスト通知を送信しました</div>
        </div>
      )}

      {state?.error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
          <div className="font-medium">❌ 送信エラー</div>
          <div className="mt-1">{state.error}</div>
        </div>
      )}
    </div>
  );
}
