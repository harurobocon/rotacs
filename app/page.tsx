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
        <OverviewTable />
      </section>
    </>
  );
}
