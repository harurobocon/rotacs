"use server";

import React from "react";

import OverviewTable from "@/components/overview-table";
import Banner from "@/components/banner";

export default async function Home() {
  return (
    <>
      {/* <Banner
        message="💬 ご感想お待ちしています！"
        buttonText="アンケートに回答"
        href="https://forms.gle/x5fWZB3QBcDbRHyv5"
      /> */}
      <section className="flex flex-col items-center justify-center gap-4 py-4">
        <div className="w-full max-w-4xl rounded-lg bg-yellow-50 p-4 text-center text-sm text-yellow-800">
          <p>
            現在表示中のデータはテスト用のダミーデータです。テストラン受付開始前にリセットされます。
          </p>
        </div>
        <OverviewTable />
      </section>
    </>
  );
}
