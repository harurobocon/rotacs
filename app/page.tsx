import React from "react";

import OverviewTable from "@/components/overview-table";
import Banner from "@/components/banner";
import { getAllFirestoreUsers } from "@/lib/server/firestoreUserHelpers";

export const dynamic = "force-dynamic";

export default async function Home() {
  const firestoreUsers = await getAllFirestoreUsers();

  const getPitSideOrder = (pitSide: string): number => {
    if (pitSide === "ピット") return 0;
    if (pitSide === "東") return 1;
    if (pitSide === "西") return 2;

    return 3;
  };

  const teams = firestoreUsers
    .filter((user) => user.role === "user")
    .map((user) => ({
      pitSide: user.pit_side,
      pitNumber: user.pit_number,
      id: `${user.pit_side}${user.pit_number}`,
      rowKey: `${user.pit_side}-${user.pit_number}-${user.display_name}`,
      displayName: user.display_name,
    }))
    .sort((a, b) => {
      const sideOrderDiff =
        getPitSideOrder(a.pitSide) - getPitSideOrder(b.pitSide);

      if (sideOrderDiff !== 0) {
        return sideOrderDiff;
      }

      return a.pitNumber - b.pitNumber;
    });

  return (
    <>
      <Banner
        buttonText="アンケートに回答"
        href="https://forms.gle/x5fWZB3QBcDbRHyv5"
        message="💬 ご感想お待ちしています！"
      />
      <section className="flex flex-col items-center justify-center gap-4 py-4">
        <OverviewTable teams={teams} />
      </section>
    </>
  );
}
