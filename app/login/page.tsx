"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Input } from "@heroui/react";
import { Icon } from "@iconify/react";
import { signInWithEmailAndPassword } from "firebase/auth";

import { auth } from "@/lib/firebase/clientApp";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isVisible, setIsVisible] = React.useState(false);
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);
  const [error, setError] = React.useState("");

  const toggleVisibility = () => setIsVisible(!isVisible);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    // Validate username
    if (
      !username ||
      username.length < 3 ||
      username.length > 31 ||
      !/^[a-z0-9_-]+$/.test(username)
    ) {
      setError("ユーザー名の形式が不正です．");
      setIsLoggingIn(false);

      return;
    }

    // Validate password
    if (!password || password.length < 6 || password.length > 255) {
      setError("パスワードの形式が不正です．");
      setIsLoggingIn(false);

      return;
    }

    // Convert username to email format: username@rotacs.yuchi.jp
    const emailStr = process.env.NEXT_PUBLIC_APP_DOMAIN
      ? `@${process.env.NEXT_PUBLIC_APP_DOMAIN}`
      : "@rotacs.yuchi.jp";
    const email = `${username}${emailStr}`;

    // Validate generated email format to prevent malicious domains or injection
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      setError("パスワードの形式が不正です．");
      setIsLoggingIn(false);

      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);

      // Redirect after successful login
      const redirectPath = searchParams.get("redirect") || "/";

      router.push(redirectPath);
    } catch (err: any) {
      console.error("Login error:", err);

      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/invalid-credential"
      ) {
        setError("ユーザー名またはパスワードが間違っています．");
      } else if (err.code === "auth/wrong-password") {
        setError("ユーザー名またはパスワードが間違っています．");
      } else if (err.code === "auth/too-many-requests") {
        setError(
          "ログイン試行回数が多すぎます．しばらく待ってから再度お試しください．",
        );
      } else {
        setError("ログインに失敗しました．もう一度お試しください．");
      }

      setIsLoggingIn(false);
    }
  };

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-large bg-content1 px-8 pb-10 pt-6 shadow-small">
        <p className="pb-2 text-xl font-medium">ログイン</p>
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
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
          <p className="h-6 text-sm text-red-500">{error}</p>
          <Button color="primary" isLoading={isLoggingIn} type="submit">
            ログイン
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <React.Suspense fallback={null}>
      <LoginContent />
    </React.Suspense>
  );
}
