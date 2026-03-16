"use client";

import { FC } from "react";
import { Switch, SwitchProps } from "@heroui/switch";
import { useTheme } from "next-themes";
import { useIsSSR } from "@react-aria/ssr";
import { Icon } from "@iconify/react";

import { cn } from "@/lib/cn";

export interface ThemeSwitchProps {
  className?: string;
  classNames?: SwitchProps["classNames"];
  size?: number;
}

export const ThemeSwitch: FC<ThemeSwitchProps> = ({
  className,
  classNames,
  size = 22,
}) => {
  const { theme, setTheme } = useTheme();
  const isSSR = useIsSSR();

  const onChange = () => {
    theme === "light" ? setTheme("dark") : setTheme("light");
  };

  return (
    <Switch
      className={cn(
        "cursor-pointer px-px transition-opacity",
        className,
        classNames?.base,
      )}
      color="default"
      endContent={<Icon icon="solar:moon-linear" width={size} />}
      isSelected={theme === "light" || isSSR}
      size="lg"
      startContent={<Icon icon="solar:sun-linear" width={size} />}
      onChange={onChange}
    />
  );
};
