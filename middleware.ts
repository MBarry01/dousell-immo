import { updateSession } from "@/utils/supabase/middleware";
import type { NextRequest } from "next/server";
import { contextStorage } from "./lib/context";

export async function middleware(request: NextRequest) {
  const requestId = globalThis.crypto?.randomUUID() || Math.random().toString(36).substring(7);
  const pathname = request.nextUrl.pathname;

  return await contextStorage.run({ requestId, route: pathname }, async () => {
    return await updateSession(request);
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
