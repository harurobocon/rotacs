import "server-cli-only";

import type { NextRequest } from "next/server";

export default async function middleware(request: NextRequest) {
  const currentUser = request.cookies.get(
    process.env.LUCIA_SESSION_COOKIE_NAME ?? "auth_session",
  )?.value;
  const currentUserRole = request.cookies.get(
    process.env.NEXT_PUBLIC_SESSION_COOKIE_ROLE_NAME ?? "auth_role",
  )?.value;

  if (!currentUser) {
    if (
      request.nextUrl.pathname.match(
        /^\/(settings|logout|testrun\/new|check1\/new|check2\/new|practice\/new).*/,
      )
    ) {
      return Response.redirect(
        new URL(`/login?redirect=${request.nextUrl.pathname}`, request.url),
      );
    }
  } else if (currentUser) {
    if (currentUserRole === "user") {
      if (request.nextUrl.pathname.match(/^\/settings\/(users).*/)) {
        return Response.redirect(new URL("/settings", request.url));
      }
    }
  }
}

export const config = {
  matcher: ["/((?!api/line-notify|_next/static|_next/image|.*\\.png$).*)"],
};
