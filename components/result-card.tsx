import React from "react";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Link,
  button as buttonStyles,
} from "@heroui/react";
import { Icon } from "@iconify/react";

import { cn } from "@/lib/cn";

interface ResultCardProps {
  className?: string;
  title?: string;
  message?: string;
  returnText?: string;
  returnHref?: string;
  status?: "success" | "danger" | "warning" | "primary";
  icon?: string; // カスタムアイコン指定用
}

const statusIconMap: Record<string, { icon: string; colorClass: string }> = {
  success: { icon: "mdi:check-circle", colorClass: "text-success" },
  danger: { icon: "mdi:close-circle", colorClass: "text-danger" },
  warning: { icon: "mdi:alert-circle", colorClass: "text-warning" },
  primary: { icon: "mdi:information", colorClass: "text-primary" },
  default: { icon: "mdi:information", colorClass: "text-default-500" },
};

export default function ResultCard(props: ResultCardProps) {
  const status = props.status || "default";
  const iconInfo = statusIconMap[status] || statusIconMap["default"];
  const iconName = props.icon || iconInfo.icon;
  const iconColor = iconInfo.colorClass;

  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center",
        props.className,
      )}
    >
      <Card className="w-full max-w-sm rounded-large shadow-small">
        <CardHeader className="flex flex-col items-center gap-2 pb-0 pt-8">
          <Icon className={cn("text-6xl", iconColor)} icon={iconName} />
          {props.title && (
            <p className="mt-2 text-xl font-medium">{props.title}</p>
          )}
        </CardHeader>
        <CardBody className="flex flex-col items-center px-6 pb-0 pt-2">
          {props.message && (
            <p className="text-center text-default-500">{props.message}</p>
          )}
        </CardBody>
        {props.returnText && props.returnHref && (
          <CardFooter className="flex justify-center pb-8 pt-4">
            <Link
              className={buttonStyles({ color: "primary" })}
              href={props.returnHref}
            >
              {props.returnText}
            </Link>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
