import React from "react";

import ResultCard from "@/components/result-card";

const SuccessPage: React.FC = () => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center">
      <ResultCard
        message="計量計測1予約に成功しました"
        returnHref="/check1"
        returnText="計量計測1一覧ページに戻る"
        status="success"
        title="予約成功"
      />
    </div>
  );
};

SuccessPage.displayName = "DeleteUserSuccessPage";

export default SuccessPage;
