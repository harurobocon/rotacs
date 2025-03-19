"use client";

import React from "react";
import { useFormState } from "react-dom";
import { useSearchParams } from "next/navigation";
import { Button, Input } from "@heroui/react";
import { Icon } from "@iconify/react";

import { login } from "@/lib/server/auth";
import { ActionResult } from "@/types/actions";

const loginInitialState: ActionResult = {
  errors: "",
};

export default function Login() {
  const searchParams = useSearchParams();
  const [isVisible, setIsVisible] = React.useState(false);
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);
  const [loginState, loginFormAction] = useFormState(login, loginInitialState);

  const toggleVisibility = () => setIsVisible(!isVisible);

  const handleSubmit = async () => {
    setIsLoggingIn(true);
  };

  React.useEffect(() => {
    setIsLoggingIn(false);
  }, [loginState]);

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-large bg-content1 px-8 pb-10 pt-6 shadow-small">
        <p className="pb-2 text-xl font-medium">ログイン</p>
        <form
          action={loginFormAction}
          className="flex flex-col gap-3"
          onSubmit={handleSubmit}
        >
          <Input
            label="ユーザー名"
            name="username"
            placeholder="ユーザー名を入力"
            variant="bordered"
          />
          <Input
            endContent={
              <button type="button" onClick={toggleVisibility}>
                {isVisible ? (
                  <Icon
                    className="pointer-events-none text-2xl text-default-400"
                    icon="solar:eye-closed-linear"
                  />
                ) : (
                  <Icon
                    className="pointer-events-none text-2xl text-default-400"
                    icon="solar:eye-bold"
                  />
                )}
              </button>
            }
            label="パスワード"
            name="password"
            placeholder="パスワードを入力"
            type={isVisible ? "text" : "password"}
            variant="bordered"
          />
          <input
            name="redirect"
            type="hidden"
            value={searchParams.get("redirect") || "/"}
          />
          <p className="h-6 text-sm text-red-500">{loginState.errors}</p>
          <Button color="primary" isLoading={isLoggingIn} type="submit">
            ログイン
          </Button>
        </form>
      </div>
    </div>
  );
}
