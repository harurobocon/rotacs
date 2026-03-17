"use client";

import "client-only";

import { Dropdown, DropdownTrigger, Avatar, Link } from "@heroui/react";
import { button as buttonStyle } from "@heroui/theme";

import UserMenuDropdownMenu from "./usermenu-dropdownmenu";

import { useAuth } from "@/lib/contexts/AuthContext";

export default function UserMenu() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="mt-1 flex h-8 w-8 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

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
