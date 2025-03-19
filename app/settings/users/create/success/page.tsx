import React from "react";
import { Link, button as buttonStyles } from "@heroui/react";

const CreateUserSuccessPage: React.FC = () => {
  return (
    <div className="flex h-full w-full items-center justify-center pt-4 md:pt-6">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-large bg-success-50 px-8 pb-10 pt-6 shadow-small">
        <p className="pb-2 text-xl font-medium">ユーザーの追加に成功しました</p>
        <Link
          className={buttonStyles({
            color: "primary",
          })}
          href="/settings/users"
        >
          ユーザー設定ページに戻る
        </Link>
      </div>
    </div>
  );
};

CreateUserSuccessPage.displayName = "CreateUserSuccessPage";

export default CreateUserSuccessPage;
