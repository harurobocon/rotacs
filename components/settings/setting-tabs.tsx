"use client"; // Workaround for a Next.js bug: https://github.com/nextui-org/nextui/issues/1342

import { Tabs, Tab } from "@heroui/react";
import { usePathname } from "next/navigation";

import { siteConfig } from "@/config/site";

export default function SettingTabs({ isAdmin = false }) {
  const pathname = usePathname();

  const settingTabItems = isAdmin
    ? siteConfig.adminSettingTabItems
    : siteConfig.settingTabItems;

  return (
    <Tabs
      fullWidth
      aria-label="Setting Tabs"
      classNames={{
        base: "mt-6",
        cursor: "bg-content1 dark:bg-content1",
        panel: "w-full p-0 pt-4",
        // tabList: "w-full relative rounded-none p-0 gap-4 lg:gap-6",
        // tab: "max-w-fit px-0 h-12",
        // tabContent: "text-default-400",
      }}
      items={settingTabItems}
      selectedKey={pathname}
      variant="solid"
    >
      {(item) => <Tab key={item.href} href={item.href} title={item.label} />}
    </Tabs>
  );
}
