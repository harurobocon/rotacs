import { Metadata } from "next";

import { WaitingDisplayView } from "@/components/display/waiting-display-view";

export const metadata: Metadata = {
  title: "待機場案内モニター（当日・計量2）",
  description:
    "待機場・ピット向けリアルタイム呼出案内モニター（当日：計量計測2・テストラン・試走場）",
};

export default function WaitingDisplayCheck2Page() {
  return <WaitingDisplayView checkType="check2" />;
}
