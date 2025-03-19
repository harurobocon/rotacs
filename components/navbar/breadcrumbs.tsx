"use client";

import { usePathname } from "next/navigation";
import {
  Breadcrumbs as NextUiBreadcrumbs,
  BreadcrumbItem,
  Link,
} from "@heroui/react";
import { capitalize } from "@heroui/shared-utils";

import { routes } from "@/config/site";

export default function Breadcrumbs() {
  const pathname = usePathname();

  return (
    <NextUiBreadcrumbs className="hidden lg:flex" radius="full">
      {pathname === "/" ? (
        <> </>
      ) : (
        pathname.split("/").map((currentDir, index) => {
          const pathDirs = pathname.split("/").slice(1, index + 1);

          const pathUrl = pathDirs.join("/");

          let currentDirLabel = "";

          try {
            if (pathDirs.length === 1) {
              currentDirLabel = routes[pathDirs[0]]?.label;
            } else if (pathDirs.length === 2) {
              currentDirLabel = routes[pathDirs[0]][pathDirs[1]]?.label;
            } else if (pathDirs.length === 3) {
              currentDirLabel =
                routes[pathDirs[0]][pathDirs[1]][pathDirs[2]]?.label;
            } else if (pathDirs.length === 4) {
              currentDirLabel =
                routes[pathDirs[0]][pathDirs[1]][pathDirs[2]][pathDirs[3]]
                  ?.label;
            } else if (pathDirs.length === 5) {
              currentDirLabel =
                routes[pathDirs[0]][pathDirs[1]][pathDirs[2]][pathDirs[3]][
                  pathDirs[4]
                ]?.label;
            } else if (pathDirs.length === 6) {
              currentDirLabel =
                routes[pathDirs[0]][pathDirs[1]][pathDirs[2]][pathDirs[3]][
                  pathDirs[4]
                ][pathDirs[5]]?.label;
            } else if (pathDirs.length === 7) {
              currentDirLabel =
                routes[pathDirs[0]][pathDirs[1]][pathDirs[2]][pathDirs[3]][
                  pathDirs[4]
                ][pathDirs[5]][pathDirs[6]]?.label;
            } else if (pathDirs.length === 8) {
              currentDirLabel =
                routes[pathDirs[0]][pathDirs[1]][pathDirs[2]][pathDirs[3]][
                  pathDirs[4]
                ][pathDirs[5]][pathDirs[6]][pathDirs[7]]?.label;
            } else if (pathDirs.length === 9) {
              currentDirLabel =
                routes[pathDirs[0]][pathDirs[1]][pathDirs[2]][pathDirs[3]][
                  pathDirs[4]
                ][pathDirs[5]][pathDirs[6]][pathDirs[7]][pathDirs[8]]?.label;
            } else if (pathDirs.length === 10) {
              currentDirLabel =
                routes[pathDirs[0]][pathDirs[1]][pathDirs[2]][pathDirs[3]][
                  pathDirs[4]
                ][pathDirs[5]][pathDirs[6]][pathDirs[7]][pathDirs[8]][
                  pathDirs[9]
                ]?.label;
            }
          } catch (error) {
            currentDirLabel = "Unknown";
          }

          return (
            <BreadcrumbItem key={index}>
              <Link className="text-inherit" href={`/${pathUrl}`}>
                {currentDir === ""
                  ? "Home"
                  : currentDirLabel
                    ? capitalize(currentDirLabel)
                    : currentDir}
              </Link>
            </BreadcrumbItem>
          );
        })
      )}
    </NextUiBreadcrumbs>
  );
}
