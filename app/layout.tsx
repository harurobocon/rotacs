import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import { Link, button as buttonStyles } from "@heroui/react";
import clsx from "clsx";

import { Providers } from "./providers";

import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";
import { Navbar } from "@/components/navbar";
import { Icon } from "@iconify/react";
import { Tooltip } from "@heroui/react";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning lang="ja">
      <head />
      <body
        className={clsx(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable,
        )}
      >
        <Providers themeProps={{ attribute: "class", defaultTheme: "dark" }}>
          <div className="relative flex min-h-screen flex-col">
            <Navbar />
            <main className="container mx-auto h-full max-w-7xl flex-grow flex-col px-2 pt-6 md:px-8">
              {children}
            </main>
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
            <footer className="flex w-full items-center justify-center py-3">
              <Link
                isExternal
                className="flex items-center gap-1 text-current"
                href="https://github.com/harurobocon/rotacs"
                title="RoTACS GitHub Repository"
              >
                <Icon icon="mdi:github" />
                <p className="text-primary">Repository</p>
              </Link>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
