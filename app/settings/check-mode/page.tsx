"use client";

import "client-only";

import React, { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Radio,
  RadioGroup,
  Snippet,
} from "@heroui/react";
import { redirect } from "next/navigation";

import { getCheckLocationSettings } from "@/lib/client/settings";
import { updateCheckLocationSettings } from "@/lib/server/settings";
import { CheckLocationSettings, CheckLocationMode } from "@/types/settings";
import { ActionResult } from "@/types/actions";
import { AuthGuard } from "@/components/AuthGuard";

const initialState: ActionResult = {
  errors: "",
};

function SubmitButton() {
  return (
    <Button color="primary" type="submit">
      設定を保存
    </Button>
  );
}

export default function CheckModePage() {
  const [settings, setSettings] = useState<CheckLocationSettings | null>(null);
  const [formState, formAction] = useFormState(
    updateCheckLocationSettings,
    initialState,
  );
  useEffect(() => {
    getCheckLocationSettings().then(setSettings);
  }, []);

  const handleSettingChange = (
    checkType: "check1" | "check2",
    value: CheckLocationMode,
  ) => {
    if (settings) {
      setSettings({
        ...settings,
        [checkType]: value,
      });
    }
  };

  if (!settings) {
    return <div>読み込み中...</div>;
  }

  return (
    <AuthGuard requireAdmin>
      <div className="flex h-full w-full flex-col items-center gap-4 p-4">
        <h1 className="text-2xl font-bold">計量計測モード設定</h1>
        <form action={formAction} className="w-full max-w-2xl">
          {formState.errors && (
            <Snippet className="mb-4" color="danger">
              {formState.errors}
            </Snippet>
          )}
          {formState.success && (
            <Snippet className="mb-4" color="success">
              {formState.success}
            </Snippet>
          )}
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">計量計測1（前日）</h2>
              </CardHeader>
              <CardBody className="gap-4">
                <RadioGroup
                  description="計量計測場所のモードを選択してください"
                  label="実施場所モード"
                  name="check1"
                  orientation="horizontal"
                  value={settings.check1}
                  onValueChange={(v) =>
                    handleSettingChange("check1", v as CheckLocationMode)
                  }
                >
                  <Radio value="single">1箇所モード（ピット）</Radio>
                  <Radio value="dual">2箇所モード（西・東）</Radio>
                </RadioGroup>
                <p className="text-sm text-default-500">
                  {settings.check1 === "dual"
                    ? "ユーザーのピットサイド（西・東）に応じて自動的に振り分けられます。"
                    : "全てのユーザーが1つの計量計測場所を使用します。"}
                </p>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">計量計測2（当日）</h2>
              </CardHeader>
              <CardBody className="gap-4">
                <RadioGroup
                  description="計量計測場所のモードを選択してください"
                  label="実施場所モード"
                  name="check2"
                  orientation="horizontal"
                  value={settings.check2}
                  onValueChange={(v) =>
                    handleSettingChange("check2", v as CheckLocationMode)
                  }
                >
                  <Radio value="single">1箇所モード（ピット）</Radio>
                  <Radio value="dual">2箇所モード（西・東）</Radio>
                </RadioGroup>
                <p className="text-sm text-default-500">
                  {settings.check2 === "dual"
                    ? "ユーザーのピットサイド（西・東）に応じて自動的に振り分けられます。"
                    : "全てのユーザーが1つの計量計測場所を使用します。"}
                </p>
              </CardBody>
            </Card>
          </div>
          <div className="mt-4">
            <SubmitButton />
          </div>
        </form>
      </div>
    </AuthGuard>
  );
}
