import "server-cli-only";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export default async function middleware(request: NextRequest) {
  // Client-side authentication is handled by Firebase Auth
  // Middleware only handles basic routing
  
  const protectedPaths = /^\/(settings|logout|testrun\/new|check1\/new|check2\/new|practice\/new).*/;
  
  // Redirect unauthenticated users to login page
  // Note: Firebase Auth state is managed client-side, so we can't check it here
  // The redirect will be handled by the client-side auth context
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.png$).*)"],
};
