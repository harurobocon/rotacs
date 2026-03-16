"use client";

import React from "react";
import { Button } from "@heroui/react";
import { useFormState } from "react-dom";

import { handleSlackTestMessageSend } from "@/app/settings/notification/actions";
import { useAuth } from "@/lib/contexts/AuthContext";

const initialSlackState = {};

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
    <form action={formAction} onSubmit={() => setIsLoading(true)}>
      <input name="userId" type="hidden" value={user?.uid ?? ""} />
      <Button color="primary" isLoading={isLoading} type="submit">
        Slackテスト通知
      </Button>
    </form>
  );
}
