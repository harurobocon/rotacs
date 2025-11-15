"use client";

import "client-only";

import React from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Autocomplete,
  AutocompleteItem,
  Button,
  Input,
  Radio,
  RadioGroup,
} from "@heroui/react";
import { User } from "lucia";

import { ActionResult } from "@/types/actions";
import {
  createTestrun,
  createTestrunMessageCard,
} from "@/lib/server/testrun";
import { getAllUsersJson } from "@/lib/server/auth";
import MessageCardForm from "@/components/MessageCardForm";
import { useReservationControl } from "@/hooks/useReservationControl";
import { useIsAdmin } from "@/hooks/useIsAdmin";

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
  const { isAdmin: isAdminUser } = useIsAdmin();
  const [testrunFormState, testrunFormAction] = useFormState(
    createTestrun,
    initialState,
  );
  const { isDisabled: isReservationDisabled, message: reservationMessage } =
    useReservationControl("testrun");

  const handleTestrunSubmit = async () => {
    setIsSubmitting(true);
  };

  React.useEffect(() => {
    if (isSubmitting) {
      if (testrunFormState.errors) {
        router.push("/testrun/new/failed?message=" + testrunFormState.errors);
      } else if (!testrunFormState.errors) {
        // errorsがundefinedまたは空文字列の場合は成功と判定
        router.push("/testrun/new/success");
      }
    }
  }, [testrunFormState]);

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
        <p className="pb-2 text-xl font-medium">新規テストラン予約</p>
        <form
          action={testrunFormAction}
          className="flex flex-col gap-3"
          onSubmit={handleTestrunSubmit}
        >
          <RadioGroup
            label="フィールドの色を選択してください"
            name="side"
            onValueChange={setSide}
          >
            <Radio value="赤">赤</Radio>
            <Radio value="青">青</Radio>
          </RadioGroup>
          {isAdminUser ? usersDropdown : null}
          {isAdminUser && selectedUser ? (
            <input
              defaultValue={selectedUser.toString()}
              name="bookerId"
              type="hidden"
            />
          ) : null}
          <Button
            color="primary"
            isDisabled={side === "" || isReservationDisabled || isSubmitting}
            isLoading={isSubmitting}
            type="submit"
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
            action={createTestrunMessageCard}
            successRedirect="/testrun/new/success?message=カードを作成しました"
            failedRedirect="/testrun/new/failed"
            enableSideSelect={true}
          />
        </div>
      ) : null}
    </div>
  );
}
