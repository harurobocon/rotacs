"use client";

import { DropdownItem, DropdownMenu } from "@heroui/react";
import { User } from "lucia";

import { siteConfig } from "@/config/site";

export default function UserMenuDropdownMenu(props: { userJson: string }) {
  const user = JSON.parse(props.userJson) as User;

  const items = [
    <DropdownItem key="profile" className="h-14 gap-2" textValue="プロフィール">
      <p className="font-semibold">{user.username}</p>
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
