"use client";

import "client-only";

import React from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { Autocomplete, AutocompleteItem, Button } from "@heroui/react";
import { User } from "lucia";

import { ActionResult } from "@/types/actions";
import {
  createPractice,
  createPracticeMessageCard,
} from "@/lib/server/practice";
import { getAllUsersJson } from "@/lib/server/auth";
import { isAdmin } from "@/lib/client/auth";
import MessageCardForm from "@/components/MessageCardForm";

const initialState: ActionResult = {
  errors: "",
};

export default function NewPractice() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [users, setUsers] = React.useState<User[] | null>(null);
  const [selectedUser, setSelectedUser] = React.useState<React.Key | null>(
    null,
  );
  const [formState, formAction] = useFormState(createPractice, initialState);

  const handleSubmit = async () => {
    setIsSubmitting(true);
  };

  React.useEffect(() => {
    if (isSubmitting) {
      if (formState.errors) {
        router.push("/practice/new/failed?message=" + formState.errors);
      } else {
        router.push("/practice/new/success");
      }
    }
  }, [formState]);

  React.useEffect(() => {
    getAllUsersJson().then((usersJson: string) => {
      setUsers(JSON.parse(usersJson));
    });
  }, []);

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
        <p className="pb-2 text-xl font-medium">新規試走場予約</p>
        <form
          action={formAction}
          className="flex flex-col gap-3"
          onSubmit={handleSubmit}
        >
          {isAdmin() ? usersDropdown : null}
          {isAdmin() && selectedUser ? (
            <input
              defaultValue={selectedUser.toString()}
              name="bookerId"
              type="hidden"
            />
          ) : null}
          <input name="side" type="hidden" value="default" />
          <Button color="primary" isLoading={isSubmitting} type="submit">
            予約する
          </Button>
        </form>
      </div>
      {isAdmin() ? (
        <div className="flex w-full max-w-sm flex-col gap-4 rounded-large bg-content1 px-8 pb-10 pt-6 shadow-small">
          <p className="pb-2 text-xl font-medium">
            任意名のカードを作成（休憩・対戦形式など）
          </p>
          <MessageCardForm
            action={createPracticeMessageCard}
            failedRedirect="/practice/new/failed"
            hiddenFields={[{ name: "side", value: "default" }]}
            successRedirect="/practice/new/success?message=カードを作成しました"
          />
        </div>
      ) : null}
    </div>
  );
}
