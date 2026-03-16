import "server-cli-only";

import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

export default async function middleware(_request: NextRequest) {
  // Client-side authentication is handled by Firebase Auth
  // Middleware only handles basic routing

  // Redirect unauthenticated users to login page
  // Note: Firebase Auth state is managed client-side, so we can't check it here
  // The redirect will be handled by the client-side auth context

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.png$).*)"],
};
