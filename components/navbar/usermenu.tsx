"use client";

import "client-only";

import { Dropdown, DropdownTrigger, Avatar, Link } from "@heroui/react";
import { button as buttonStyle } from "@heroui/theme";

import UserMenuDropdownMenu from "./usermenu-dropdownmenu";

import { useAuth } from "@/lib/contexts/AuthContext";

export default function UserMenu() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Link
        className={buttonStyle({
          color: "primary",
          radius: "full",
        })}
        href="/login"
      >
        Log In
      </Link>
    );
  } else {
    return (
      <Dropdown placement="bottom-end">
        <DropdownTrigger>
          <button className="mt-1 h-8 w-8 outline-none transition-transform">
            <Avatar
              isBordered
              color="default"
              name={user.email?.slice(0, 2).toUpperCase() || "U"}
              size="sm"
            />
          </button>
        </DropdownTrigger>
        <UserMenuDropdownMenu />
      </Dropdown>
    );
  }
}
