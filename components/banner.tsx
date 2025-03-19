"use client";

import React from "react";
import { Button, Link } from "@heroui/react";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/cn";

type BannerProps = {
  message: string;
  buttonText: string;
  href: string;
};

export default function Banner(props: BannerProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 w-full px-2 pb-2 sm:flex sm:justify-center sm:px-4 sm:pb-4 lg:px-8">
      <div className="pointer-events-auto flex items-center gap-x-3 rounded-large border-1 border-divider bg-primary py-2 sm:px-6">
        <div className="flex w-full items-center gap-x-4">
          <p className="text-small font-semibold text-primary-foreground">
            <Link className="text-inherit" href={props.href}>
              {props.message}
            </Link>
          </p>
          <Button
            as={Link}
            className="group relative h-9 overflow-hidden bg-primary-foreground text-small font-normal text-primary"
            color="default"
            endContent={
              <Icon
                className="flex-none outline-none transition-transform group-data-[hover=true]:translate-x-0.5 [&>path]:stroke-[2]"
                icon="solar:arrow-right-linear"
                width={16}
              />
            }
            href={props.href}
            variant="flat"
          >
            {props.buttonText}
          </Button>
        </div>
      </div>
    </div>
  );
}
