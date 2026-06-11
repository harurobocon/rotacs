"use client";

import "client-only";

import React, { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Checkbox,
  Snippet,
} from "@heroui/react";

import { getDisplaySettings } from "@/lib/client/settings";
import { updateDisplaySettings } from "@/lib/server/settings";
import { DisplaySettings } from "@/types/settings";
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

export default function DisplaySettingsPage() {
  const [settings, setSettings] = useState<DisplaySettings | null>(null);
  const [formState, formAction] = useFormState(
    updateDisplaySettings,
    initialState,
  );

  useEffect(() => {
    getDisplaySettings().then((displaySettings) => {
      setSettings(displaySettings);
    });
  }, []);

  if (!settings) {
    return <div>読み込み中...</div>;
  }

  return (
    <AuthGuard requireAdmin>
      <div className="flex h-full w-full flex-col items-center gap-4 p-4">
        <h1 className="text-2xl font-bold">表示設定</h1>
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
                <h2 className="text-xl font-semibold">
                  アンケートフォーム表示設定
                </h2>
              </CardHeader>
              <CardBody className="gap-4">
                <div className="flex flex-col gap-3">
                  <Checkbox
                    isSelected={settings.showSurveyFloat}
                    onValueChange={(v) =>
                      setSettings({ ...settings, showSurveyFloat: v })
                    }
                  >
                    アンケートフォームへのリンク（フロートボタン）を表示する
                  </Checkbox>
                  <input
                    name="showSurveyFloat"
                    type="hidden"
                    value={String(settings.showSurveyFloat)}
                  />

                  <Checkbox
                    isSelected={settings.showSurveyBanner}
                    onValueChange={(v) =>
                      setSettings({ ...settings, showSurveyBanner: v })
                    }
                  >
                    アンケートフォームへのリンク（トップページバナー）を表示する
                  </Checkbox>
                  <input
                    name="showSurveyBanner"
                    type="hidden"
                    value={String(settings.showSurveyBanner)}
                  />
                </div>
                <p className="mt-2 text-sm text-default-500">
                  有効にすると、ユーザー画面にアンケート回答を促す各種コンポーネントが表示されます。それぞれ個別に表示・非表示を制御できます。
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
