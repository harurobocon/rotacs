"use client";

import "client-only";

import React from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { Autocomplete, AutocompleteItem, Button } from "@heroui/react";
import { User } from "lucia";

import { ActionResult } from "@/types/actions";
import { createCheck, createCheckMessageCard } from "@/lib/server/check";
import { getAllUsersJson } from "@/lib/server/auth";
import { CHECK2_COLLECTION } from "@/types/check";
import MessageCardForm from "@/components/MessageCardForm";
import { useReservationControl } from "@/hooks/useReservationControl";
import {
  getCheckLocationSettings,
  listenCheckLocationSettings,
} from "@/lib/client/settings";
import { CheckLocationMode } from "@/types/settings";
import { useIsAdmin } from "@/hooks/useIsAdmin";

const initialState: ActionResult = {
  errors: "",
};

export default function NewCheck() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [users, setUsers] = React.useState<User[] | null>(null);
  const [selectedUser, setSelectedUser] = React.useState<React.Key | null>(
    null,
  );
  const [mode, setMode] = React.useState<CheckLocationMode>("single");
  const { isAdmin: isAdminUser } = useIsAdmin();
  const [formState, formAction] = useFormState(createCheck, initialState);
  const { isDisabled: isReservationDisabled, message: reservationMessage } =
    useReservationControl("check2");

  const handleSubmit = async () => {
    setIsSubmitting(true);
  };

  React.useEffect(() => {
    if (isSubmitting) {
      if (formState.errors) {
        router.push("/check2/new/failed?message=" + formState.errors);
      } else {
        router.push("/check2/new/success");
      }
    }
  }, [formState]);

  React.useEffect(() => {
    // 計量計測モード設定を取得
    getCheckLocationSettings().then((settings) => {
      setMode(settings.check2);
    });

    // モード設定の変更をリスニング
    const unsubscribe = listenCheckLocationSettings((settings) => {
      setMode(settings.check2);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  React.useEffect(() => {
    if (isAdminUser) {
      getAllUsersJson().then((usersJson: string) => {
        setUsers(JSON.parse(usersJson));
      });
    }
  }, [isAdminUser]);

  const usersDropdown = React.useMemo(() => {
    const items = users?.map((user) => ({
      key: user.id,
      label: user.display_name,
    }));

    if (items) {
      return (
        <Autocomplete
          defaultItems={items}
          isDisabled={users === null}
          label={users ? "予約するユーザーを選択" : "読み込み中"}
          onSelectionChange={(key) => {
            console.log(key);
            setSelectedUser(key);
          }}
        >
          {(item) => (
            <AutocompleteItem key={item.key}>{item.label}</AutocompleteItem>
          )}
        </Autocomplete>
      );
    } else {
      return null;
    }
  }, [users]);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-large bg-content1 px-8 pb-10 pt-6 shadow-small">
        <p className="pb-2 text-xl font-medium">新規計量計測2予約（当日）</p>
        <p className="text-sm text-default-500">
          {mode === "dual"
            ? "計量計測場所は西・東の2箇所です。ピットサイドに応じて自動的に振り分けられます。"
            : "計量計測エリアは1つです。"}
        </p>
        <form
          action={formAction}
          className="flex flex-col gap-3"
          onSubmit={handleSubmit}
        >
          {isAdminUser ? usersDropdown : null}
          {isAdminUser && selectedUser ? (
            <input
              defaultValue={selectedUser.toString()}
              name="bookerId"
              type="hidden"
            />
          ) : null}
          <input
            defaultValue={CHECK2_COLLECTION}
            name="collectionId"
            type="hidden"
          />
          <Button
            color="primary"
            isLoading={isSubmitting}
            type="submit"
            isDisabled={isReservationDisabled || isSubmitting}
          >
            予約する
          </Button>
          {reservationMessage && (
            <p className="pt-2 text-center text-sm text-danger">
              {reservationMessage}
            </p>
          )}
        </form>
      </div>
      {isAdminUser ? (
        <div className="flex w-full max-w-sm flex-col gap-4 rounded-large bg-content1 px-8 pb-10 pt-6 shadow-small">
          <p className="pb-2 text-xl font-medium">
            任意名のカードを作成（休憩・対戦形式など）
          </p>
          <MessageCardForm
            action={createCheckMessageCard}
            successRedirect="/check2/new/success?message=カードを作成しました"
            failedRedirect="/check2/new/failed"
            hiddenFields={[{ name: "collectionId", value: CHECK2_COLLECTION }]}
          />
        </div>
      ) : null}
    </div>
  );
}
