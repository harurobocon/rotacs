"use client";

import React, { useEffect, useState } from "react";
import { Link } from "@heroui/react";
import { Icon } from "@iconify/react";
import { Tooltip } from "@heroui/react";
import { button as buttonStyles } from "@heroui/react";

import { cn } from "@/lib/cn";
import { listenDisplaySettings } from "@/lib/client/settings";

export default function SurveyFloat() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = listenDisplaySettings((settings) => {
      setShow(settings.showSurveyFloat);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading || !show) {
    return null;
  }

  return (
    <Tooltip content="アンケートにご協力ください🙇" placement="left">
      <Link
        isExternal
        className={cn([
          buttonStyles({
            isIconOnly: true,
            radius: "full",
            size: "md",
            variant: "faded",
          }),
          "fixed bottom-4 right-4 z-10 overflow-visible shadow-md md:bottom-8 md:right-8",
        ])}
        href="https://forms.gle/x5fWZB3QBcDbRHyv5"
      >
        <Icon icon="fluent:person-feedback-24-regular" width={28} />
      </Link>
    </Tooltip>
  );
}
