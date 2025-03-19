"use client"; // Workaround for a Next.js bug: https://github.com/nextui-org/nextui/issues/1342

import { Tabs, Tab } from "@heroui/react";
import { usePathname } from "next/navigation";

import { siteConfig } from "@/config/site";

export default function NavigationTabs() {
  const pathname = usePathname();

  const { tabItems } = siteConfig;

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
      selectedKey={pathname}
      variant="underlined"
    >
      {(item) => <Tab key={item.href} href={item.href} title={item.label} />}
    </Tabs>
  );
}
