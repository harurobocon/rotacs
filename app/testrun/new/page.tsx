"use client";

import "client-only";

import React from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Autocomplete,
  AutocompleteItem,
  Button,
  Radio,
  RadioGroup,
} from "@heroui/react";
import { User } from "lucia";

import { ActionResult } from "@/types/actions";
import { createTestrun } from "@/lib/server/testrun";
import { getAllUsersJson } from "@/lib/server/auth";
import { isAdmin } from "@/lib/client/auth";

const initialState: ActionResult = {
  errors: "",
};

export default function NewTestrun() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [users, setUsers] = React.useState<User[] | null>(null);
  const [selectedUser, setSelectedUser] = React.useState<React.Key | null>(
    null,
  );
  const [side, setSide] = React.useState<string>("");
  const [formState, formAction] = useFormState(createTestrun, initialState);
  // const [formState, formAction] = useFormState(
  //   testConcurrentCreateTestrun,
  //   initialState,
  // );

  const handleSubmit = async () => {
    setIsSubmitting(true);
  };

  React.useEffect(() => {
    if (isSubmitting) {
      if (formState.errors) {
        router.push("/testrun/new/failed?message=" + formState.errors);
      } else {
        router.push("/testrun/new/success");
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
            <AutocompleteItem key={item.key} value={item.key}>
              {item.label}
            </AutocompleteItem>
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
        <p className="pb-2 text-xl font-medium">新規テストラン予約</p>
        <form
          action={formAction}
          className="flex flex-col gap-3"
          onSubmit={handleSubmit}
        >
          <RadioGroup
            label="フィールドの色を選択してください"
            name="side"
            onValueChange={setSide}
          >
            <Radio value="赤">赤</Radio>
            <Radio value="青">青</Radio>
          </RadioGroup>
          {isAdmin() ? usersDropdown : null}
          {isAdmin() && selectedUser ? (
            <input
              defaultValue={selectedUser.toString()}
              name="bookerId"
              type="hidden"
            />
          ) : null}
          <Button
            color="primary"
            isDisabled={side === ""}
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
