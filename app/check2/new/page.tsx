"use client";

import "client-only";

import React from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { Autocomplete, AutocompleteItem, Button } from "@heroui/react";
import { User } from "lucia";

import { ActionResult } from "@/types/actions";
import { createCheck } from "@/lib/server/check";
import { getAllUsersJson } from "@/lib/server/auth";
import { isAdmin } from "@/lib/client/auth";
import { CHECK2_COLLECTION } from "@/types/check";

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
  const [formState, formAction] = useFormState(createCheck, initialState);
  // const [formState, formAction] = useFormState(
  //   testConcurrentCreateCheck,
  //   initialState,
  // );

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
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-large bg-content1 px-8 pb-10 pt-6 shadow-small">
        <p className="pb-2 text-xl font-medium">
          新規計量計測2予約（当日金曜日）
        </p>
        <p className="text-sm text-default-500">計量計測エリアは1つです．</p>
        <p className="text-sm font-bold text-default-500">
          受付開始はhh:mmです．それ以前の予約は削除します．
        </p>
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
          <input
            defaultValue={CHECK2_COLLECTION}
            name="collectionId"
            type="hidden"
          />
          <Button
            color="primary"
            isDisabled={true}
            isLoading={isSubmitting}
            type="submit"
          >
            予約する
          </Button>
        </form>
      </div>
    </div>
  );
}
