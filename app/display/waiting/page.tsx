import { Metadata } from "next";

import { WaitingDisplayView } from "@/components/display/waiting-display-view";

export const metadata: Metadata = {
  title: "待機場案内モニター",
  description:
    "待機場・ピット向けリアルタイム呼出案内モニター（計量計測・テストラン・試走場）",
};

interface WaitingDisplayPageProps {
  searchParams?: {
    check?: string;
  };
}

export default function WaitingDisplayPage({
  searchParams,
}: WaitingDisplayPageProps) {
  const checkParam = searchParams?.check;
  const checkType =
    checkParam === "2" || checkParam === "check2" ? "check2" : "check1";

  return <WaitingDisplayView checkType={checkType} />;
}
