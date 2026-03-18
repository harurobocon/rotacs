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
  Input,
  Radio,
  RadioGroup,
  Select,
  SelectItem,
  Snippet,
} from "@heroui/react";

import { getCheckLocationSettings } from "@/lib/client/settings";
import * as settingsClient from "@/lib/client/settings";
import {
  updateCheckItemsSettings,
  updateCheckLocationSettings,
} from "@/lib/server/settings";
import {
  CheckItemSetting,
  CheckItemsSettings,
  CheckLocationSettings,
  CheckLocationMode,
  CHECK_ITEM_TYPES,
  DEFAULT_CHECK_ITEM_SETTINGS,
} from "@/types/settings";
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

type CheckType = "check1" | "check2";

function normalizeItemId(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .replace(/^[^a-zA-Z]+/, "item_")
    .replace(/_+/g, "_")
    .toLowerCase();
}

function createNewItem(index: number): CheckItemSetting {
  return {
    id: `item_${index + 1}`,
    label: `新規項目${index + 1}`,
    type: "boolean",
    order: index,
    enabled: true,
  };
}

function sortAndReindex(items: CheckItemSetting[]): CheckItemSetting[] {
  return [...items]
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
    .map((item, index) => ({
      ...item,
      order: index,
    }));
}

export default function CheckModePage() {
  const [settings, setSettings] = useState<CheckLocationSettings | null>(null);
  const [checkItemsSettings, setCheckItemsSettings] =
    useState<CheckItemsSettings | null>(null);
  const [activeCheckType, setActiveCheckType] = useState<CheckType>("check1");
  const [modeFormState, modeFormAction] = useFormState(
    updateCheckLocationSettings,
    initialState,
  );
  const [itemsFormState, itemsFormAction] = useFormState(
    updateCheckItemsSettings,
    initialState,
  );

  useEffect(() => {
    const getItemsSettings =
      settingsClient.getCheckItemsSettings ??
      (async () => DEFAULT_CHECK_ITEM_SETTINGS);

    Promise.all([getCheckLocationSettings(), getItemsSettings()]).then(
      ([locationSettings, itemSettings]) => {
        setSettings(locationSettings);
        setCheckItemsSettings(itemSettings);
      },
    );
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

  const activeItems = sortAndReindex(
    checkItemsSettings ? checkItemsSettings[activeCheckType] : [],
  );

  const updateActiveItems = (
    updater: (items: CheckItemSetting[]) => CheckItemSetting[],
  ) => {
    setCheckItemsSettings((prev) => {
      if (!prev) {
        return prev;
      }

      return {
        ...prev,
        [activeCheckType]: sortAndReindex(updater(prev[activeCheckType])),
      };
    });
  };

  const updateItem = (
    itemIndex: number,
    key: keyof CheckItemSetting,
    value: CheckItemSetting[keyof CheckItemSetting],
  ) => {
    updateActiveItems((items) =>
      items.map((item, index) => {
        if (index !== itemIndex) {
          return item;
        }

        if (key === "id") {
          return {
            ...item,
            id: normalizeItemId(String(value)),
          };
        }

        return {
          ...item,
          [key]: value,
        };
      }),
    );
  };

  const moveItem = (itemIndex: number, direction: -1 | 1) => {
    updateActiveItems((items) => {
      const targetIndex = itemIndex + direction;

      if (targetIndex < 0 || targetIndex >= items.length) {
        return items;
      }

      const next = [...items];
      const [moved] = next.splice(itemIndex, 1);

      next.splice(targetIndex, 0, moved);

      // Keep the new order stable after re-render.
      return next.map((item, index) => ({
        ...item,
        order: index,
      }));
    });
  };

  const removeItem = (itemIndex: number) => {
    updateActiveItems((items) =>
      items.filter((_, index) => index !== itemIndex),
    );
  };

  const addItem = () => {
    updateActiveItems((items) => [...items, createNewItem(items.length)]);
  };

  if (!settings || !checkItemsSettings) {
    return <div>読み込み中...</div>;
  }

  return (
    <AuthGuard requireAdmin>
      <div className="flex h-full w-full flex-col items-center gap-4 p-4">
        <h1 className="text-2xl font-bold">計量計測設定</h1>
        <form action={modeFormAction} className="w-full max-w-2xl">
          {modeFormState.errors && (
            <Snippet className="mb-4" color="danger">
              {modeFormState.errors}
            </Snippet>
          )}
          {modeFormState.success && (
            <Snippet className="mb-4" color="success">
              {modeFormState.success}
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

        <form action={itemsFormAction} className="w-full max-w-5xl">
          {itemsFormState.errors && (
            <Snippet className="mb-4" color="danger">
              {itemsFormState.errors}
            </Snippet>
          )}
          {itemsFormState.success && (
            <Snippet className="mb-4" color="success">
              {itemsFormState.success}
            </Snippet>
          )}

          <Card>
            <CardHeader className="flex flex-col items-start gap-2">
              <h2 className="text-xl font-semibold">確認項目編集</h2>
              <p className="text-sm text-default-500">
                既存項目と新規項目は同一仕様です。ID・ラベル・型・表示順・有効状態をすべて編集できます。
              </p>
            </CardHeader>
            <CardBody className="gap-4">
              <RadioGroup
                label="編集対象"
                orientation="horizontal"
                value={activeCheckType}
                onValueChange={(value) =>
                  setActiveCheckType(value as CheckType)
                }
              >
                <Radio value="check1">計量計測1（前日）</Radio>
                <Radio value="check2">計量計測2（当日）</Radio>
              </RadioGroup>

              <div className="flex flex-col gap-3">
                {activeItems.map((item, index) => (
                  <Card key={`item-row-${index}`}>
                    <CardBody className="gap-3">
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <Input
                          label="項目ID"
                          labelPlacement="outside"
                          placeholder="item_id"
                          value={item.id}
                          onValueChange={(v) => updateItem(index, "id", v)}
                        />
                        <Input
                          label="表示名"
                          labelPlacement="outside"
                          placeholder="表示ラベル"
                          value={item.label}
                          onValueChange={(v) => updateItem(index, "label", v)}
                        />
                        <Select
                          disallowEmptySelection
                          label="入力タイプ"
                          labelPlacement="outside"
                          selectedKeys={[item.type]}
                          onSelectionChange={(keys) => {
                            if (keys === "all") {
                              return;
                            }

                            const selected = Array.from(keys)[0];

                            if (!selected) {
                              return;
                            }

                            updateItem(index, "type", String(selected));
                          }}
                        >
                          {CHECK_ITEM_TYPES.map((type) => (
                            <SelectItem key={type}>{type}</SelectItem>
                          ))}
                        </Select>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Checkbox
                          isSelected={item.enabled}
                          onValueChange={(v) => updateItem(index, "enabled", v)}
                        >
                          有効
                        </Checkbox>
                        <Button
                          isDisabled={index === 0}
                          size="sm"
                          type="button"
                          variant="flat"
                          onPress={() => moveItem(index, -1)}
                        >
                          上へ
                        </Button>
                        <Button
                          isDisabled={index === activeItems.length - 1}
                          size="sm"
                          type="button"
                          variant="flat"
                          onPress={() => moveItem(index, 1)}
                        >
                          下へ
                        </Button>
                        <Button
                          color="danger"
                          size="sm"
                          type="button"
                          variant="flat"
                          onPress={() => removeItem(index)}
                        >
                          削除
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  color="secondary"
                  type="button"
                  variant="flat"
                  onPress={addItem}
                >
                  項目を追加
                </Button>
                <SubmitButton />
              </div>
            </CardBody>
          </Card>

          <input
            name="checkItemsSettings"
            type="hidden"
            value={JSON.stringify(checkItemsSettings)}
          />
        </form>
      </div>
    </AuthGuard>
  );
}
