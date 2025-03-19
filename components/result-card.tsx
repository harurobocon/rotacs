import React from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Link,
  Spacer,
  button as buttonStyles,
} from "@heroui/react";

import { cn } from "@/lib/cn";

interface ResultCardProps {
  className?: string;
  title?: string;
  message?: string;
  returnText?: string;
  returnHref?: string;
  status?: "success" | "danger" | "warning" | "primary";
}

export default function ResultCard(props: ResultCardProps) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center">
      <Card
        className={cn(
          "mt-2",
          "w-full",
          "max-w-sm",
          `bg-${props.status ? props.status : "default"}-100`,
        )}
      >
        <CardHeader className="px-6 pb-0 pt-6">
          <div className="flex flex-col items-start">
            <h4 className={cn("text-lg font-bold", `text-default-foreground`)}>
              {props.title}
            </h4>
            <p className={cn("text-small", `text-default-500`)}>
              {props.message}
            </p>
          </div>
        </CardHeader>
        <Spacer y={2} />
        <CardBody className="px-4">
          <Link
            className={buttonStyles({
              color: "primary",
            })}
            href={props.returnHref}
          >
            {props.returnText}
          </Link>
        </CardBody>
      </Card>
    </div>
  );
}
