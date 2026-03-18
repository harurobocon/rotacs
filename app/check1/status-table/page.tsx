import React from "react";

import CheckStatusTable from "@/components/check-status-table";
import {
  pageContainer,
  pageSubtitle,
  pageTitle,
} from "@/components/primitives";
import { getAllFirestoreUsers } from "@/lib/server/firestoreUserHelpers";
import { CHECK1_COLLECTION } from "@/types/check";

export const dynamic = "force-dynamic";

export default async function Check1StatusTablePage() {
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
    <div className={pageContainer()}>
      <div className="flex-col items-stretch">
        <h1 className={pageTitle()}>計量計測1 結果一覧表</h1>
        <h2 className={pageSubtitle()}>
          各チームの最新予約1件の計量計測結果を表示しています．
        </h2>
        <CheckStatusTable
          checkType="check1"
          collectionId={CHECK1_COLLECTION}
          teams={teams}
        />
      </div>
    </div>
  );
}
