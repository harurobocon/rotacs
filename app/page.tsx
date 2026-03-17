"use server";

import React from "react";

import OverviewTable from "@/components/overview-table";
import Banner from "@/components/banner";

export default async function Home() {
  return (
    <>
      <Banner
        buttonText="アンケートに回答"
        href="https://forms.gle/x5fWZB3QBcDbRHyv5"
        message="💬 ご感想お待ちしています！"
      />
      <section className="flex flex-col items-center justify-center gap-4 py-4">
        <OverviewTable />
      </section>
    </>
  );
}
