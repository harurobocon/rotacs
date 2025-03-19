"use client";

import React from "react";
import { usePathname } from "next/navigation";
import {
  NavbarMenu as NextUiNavbarMenu,
  NavbarMenuItem,
  Link,
} from "@heroui/react";
import { User } from "lucia";

import { siteConfig } from "@/config/site";

export default function NavbarMenu(props: {
  userJson?: string;
  setIsMenuOpen: () => void;
}) {
  const pathname = usePathname();
  const user = props.userJson ? (JSON.parse(props.userJson) as User) : null;

  const navMenuItems = user
    ? siteConfig.navMenuItemsSignedIn
    : siteConfig.navMenuItemsSignedOut;

  return (
    <NextUiNavbarMenu>
      {navMenuItems.map((item) => (
        <NavbarMenuItem key={item.href} isActive={item.href === pathname}>
          <Link
            className="w-full"
            color={item.href === pathname ? "primary" : "foreground"}
            href={item.href}
            onPress={() => props.setIsMenuOpen()}
          >
            {item.label}
          </Link>
        </NavbarMenuItem>
      ))}
    </NextUiNavbarMenu>
  );
}
