"use client"; // Workaround for a Next.js bug: https://github.com/nextui-org/nextui/issues/1342

import { Tabs, Tab } from "@heroui/react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

import { siteConfig } from "@/config/site";

export default function NavigationTabs() {
  const pathname = usePathname();
  const router = useRouter();

  const { tabItems } = siteConfig;

  // 1段階目のパスで判定するためのselectedKeyを計算
  const selectedKey =
    tabItems.find((item) => item.href !== "/" && pathname.startsWith(item.href))
      ?.href || "/";

  return (
    <Tabs
      aria-label="Navigation Tabs"
      className="h-12"
      classNames={{
        tabList: "w-full relative rounded-none p-0 gap-4 lg:gap-6",
        tab: "max-w-fit px-0 h-12",
        cursor: "w-full",
        tabContent: "text-default-400",
      }}
      items={tabItems}
      radius="full"
      selectedKey={selectedKey}
      variant="underlined"
      onSelectionChange={(key) => router.push(key as string)}
    >
      {(item) => <Tab key={item.href} title={item.label} />}
    </Tabs>
  );
}
