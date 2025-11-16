"use client";

import "client-only";

import React from "react";
import {
  Navbar as NextUiNavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  Link,
  ScrollShadow,
  Spacer,
} from "@heroui/react";
import { button as buttonStyles } from "@heroui/react";
import { Icon } from "@iconify/react";

import { siteConfig } from "@/config/site";
import NavigationTabs from "@/components/navbar/navigation-tabs";
import NavbarMenu from "@/components/navbar/navbar-menu";
import UserMenu from "@/components/navbar/usermenu";
import Breadcrumbs from "@/components/navbar/breadcrumbs";
import { ThemeSwitch } from "@/components/navbar/theme-switch";
import { useAuth } from "@/lib/contexts/AuthContext";

export function Navbar() {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = React.useReducer(
    (current) => !current,
    false,
  );

  return (
    <>
      <NextUiNavbar
        classNames={{
          base: "pt-2 lg:pt-4 bg-background lg:backdrop-filter-none",
          wrapper: "px-4 sm:px-6",
          item: "data-[active=true]:text-primary",
        }}
        height="60px"
        isMenuOpen={isMenuOpen}
        maxWidth="full"
        onMenuOpenChange={setIsMenuOpen}
      >
        <NavbarBrand>
          <NavbarMenuToggle className="mr-6 h-6" />
          <Link className="text-inherit" href="/">
            <p className="font-bold text-inherit">{siteConfig.name}</p>
          </Link>
        </NavbarBrand>

        {/* Right Menu */}
        <NavbarContent
          className="ml-auto h-12 max-w-fit items-center gap-0"
          justify="end"
        >
          <NavbarItem className="hidden sm:flex">
            <Breadcrumbs />
          </NavbarItem>
          <Spacer x={6} />
          {/* Search */}
          {/* <NavbarItem className="mr-2 hidden sm:flex">
            <Input
              aria-label="Search"
              classNames={{
                inputWrapper: "bg-content2 dark:bg-content1",
              }}
              labelPlacement="outside"
              placeholder="Search..."
              radius="full"
              startContent={
                <Icon
                  className="text-default-500"
                  icon="solar:magnifer-linear"
                  width={20}
                />
              }
            />
          </NavbarItem> */}
          <NavbarItem className="hidden sm:flex">
            <ThemeSwitch className="text-default-500" size={24} />
          </NavbarItem>
          {/* Settings */}
          <NavbarItem className="hidden sm:flex">
            <Link
              className={buttonStyles({
                isIconOnly: true,
                radius: "full",
                variant: "light",
              })}
              href="/settings/notification"
            >
              <Icon
                className="text-default-500"
                icon="solar:settings-linear"
                width={24}
              />
            </Link>
          </NavbarItem>
          {/* Notifications */}
          {/* <NavbarItem className="flex">
            <Popover offset={12} placement="bottom-end">
              <PopoverTrigger>
                <Button
                  disableRipple
                  isIconOnly
                  className="overflow-visible"
                  radius="full"
                  variant="light"
                >
                  <Badge
                    color="danger"
                    content="5"
                    showOutline={false}
                    size="md"
                  >
                    <Icon
                      className="text-default-500"
                      icon="solar:bell-linear"
                      width={22}
                    />
                  </Badge>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="max-w-[90vw] p-0 sm:max-w-[380px]">
                <NotificationsCard className="w-full shadow-none" />
              </PopoverContent>
            </Popover>
          </NavbarItem> */}
          {/* User Menu */}
          <NavbarItem className="px-2">
            <UserMenu />
          </NavbarItem>
        </NavbarContent>

        {/* Menu */}
        <NavbarMenu
          setIsMenuOpen={setIsMenuOpen}
        />
      </NextUiNavbar>
      <ScrollShadow
        hideScrollBar
        className="flex w-full justify-between gap-8 border-b border-divider px-4 sm:px-8"
        orientation="horizontal"
      >
        <NavigationTabs />
      </ScrollShadow>
    </>
  );
}
