"use client";

import { DropdownItem, DropdownMenu } from "@heroui/react";

import { siteConfig } from "@/config/site";
import { useAuth } from "@/lib/contexts/AuthContext";

export default function UserMenuDropdownMenu() {
  const { user } = useAuth();

  const items = [
    <DropdownItem key="profile" className="h-14 gap-2" textValue="プロフィール">
      <p className="font-semibold">{user?.email?.split("@")[0] || "User"}</p>
    </DropdownItem>,
  ];

  siteConfig.userMenuItems.forEach((item) => {
    items.push(
      <DropdownItem key={item.href} href={item.href} textValue={item.label}>
        {item.label}
      </DropdownItem>,
    );
  });

  return (
    <DropdownMenu aria-label="Profile Actions" variant="flat">
      {items}
    </DropdownMenu>
  );
}
