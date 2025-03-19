"use client";

import { Card, CardBody, Textarea, Button, Spacer } from "@heroui/react";
import React from "react";
import { useFormState } from "react-dom";

import { ActionResult } from "@/types/actions";
import { createUsers } from "@/app/settings/users/actions";
import { cn } from "@/lib/cn";

interface NewUsersTextareaProps {
  className?: string;
}

const initialCreateUsersState: ActionResult = {};

const NewUsersTextarea: React.FC = (props: NewUsersTextareaProps) => {
  const [createUsersState, createUsersDispatch] = useFormState(
    createUsers,
    initialCreateUsersState,
  );
  const [isLoading, setIsLoading] = React.useState(false);

  const onSubmit = async () => {
    setIsLoading(true);
  };

  React.useEffect(() => {
    setIsLoading(false);
  }, [createUsersState]);

  return (
    <Card
      className="mt-4 border border-default-200 bg-transparent"
      shadow="none"
    >
      <CardBody>
        <p className="text-xs font-normal text-default-400">
          CSVの形式 (1行1ユーザー):
          username,password,display_name,role,pit_side,pit_number
        </p>
        <p className="text-xs font-normal text-default-400">
          username: アルファベット小文字, 数字, _, -で4~30文字
        </p>
        <p className="text-xs font-normal text-default-400">
          password: 6~255文字
        </p>
        <p className="text-xs font-normal text-default-400">
          display_name: 表示名．任意の文字列．日本語も可．
        </p>
        <p className="text-xs font-normal text-default-400">
          role: admin または user
        </p>
        <p className="text-xs font-normal text-default-400">
          pit_side: 西または東
        </p>
        <p className="text-xs font-normal text-default-400">pit_number: 番号</p>
        <Spacer y={2} />
        <form action={createUsersDispatch} onSubmit={onSubmit}>
          <Textarea
            className={cn("mb-3 w-full", props.className)}
            errorMessage={createUsersState.errors}
            isDisabled={isLoading}
            isInvalid={
              createUsersState.errors !== undefined &&
              createUsersState.errors !== ""
            }
            label="追加するユーザーの情報のCSV"
            name="users"
            placeholder="username,password,display_name,role,pit_side,pit_number"
          />
          <Button color="primary" isLoading={isLoading} type="submit">
            ユーザーを追加
          </Button>
        </form>
      </CardBody>
    </Card>
  );
};

NewUsersTextarea.displayName = "NewUsersTextarea";

export default NewUsersTextarea;
