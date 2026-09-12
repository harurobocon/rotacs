import { Metadata } from "next";

import { WaitingDisplayView } from "@/components/display/waiting-display-view";

export const metadata: Metadata = {
  title: "待機場案内モニター（前日・計量1）",
  description:
    "待機場・ピット向けリアルタイム呼出案内モニター（前日：計量計測1・テストラン・試走場）",
};

export default function WaitingDisplayCheck1Page() {
  return <WaitingDisplayView checkType="check1" />;
}
