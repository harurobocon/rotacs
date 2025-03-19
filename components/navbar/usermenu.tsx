"use client";

import "client-only";

import { Dropdown, DropdownTrigger, Avatar, Link } from "@heroui/react";
import { button as buttonStyle } from "@heroui/theme";
import { User } from "lucia";

import UserMenuDropdownMenu from "./usermenu-dropdownmenu";

export default function UserMenu(props: { userJson: string }) {
  const user = props.userJson ? (JSON.parse(props.userJson) as User) : null;

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
              name={user.username.slice(0, 2).toUpperCase()}
              size="sm"
            />
          </button>
        </DropdownTrigger>
        <UserMenuDropdownMenu userJson={JSON.stringify(user)} />
      </Dropdown>
    );
  }
}
