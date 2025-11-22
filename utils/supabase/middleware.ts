import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Use placeholder values during build/runtime if env vars are missing
  // This allows the app to work even if credentials are not yet configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

  // If credentials are missing, skip auth checks and allow all requests
  // This prevents middleware from crashing during initial deployment
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  let user = null;
  try {
  const {
      data: { user: authUser },
  } = await supabase.auth.getUser();
    user = authUser;
  } catch (error) {
    // If Supabase is not available or credentials are invalid, continue without auth
    // This allows the app to work even if Supabase is not configured yet
    console.warn("Middleware: Error getting user (this is OK if Supabase is not configured):", error);
  }

  if (
    !user &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/register") &&
    !request.nextUrl.pathname.startsWith("/auth") &&
    (request.nextUrl.pathname.startsWith("/compte") ||
      request.nextUrl.pathname.startsWith("/admin"))
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // If the user is logged in and tries to access login/register, redirect to account
  if (
    user &&
    (request.nextUrl.pathname.startsWith("/login") ||
      request.nextUrl.pathname.startsWith("/register"))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/compte";
    return NextResponse.redirect(url);
  }

  // Admin access restriction: only allow barrymohamadou98@gmail.com
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!user) {
      // Already handled above, but double check
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    // Check if user email is authorized for admin access
    const authorizedAdminEmail = "barrymohamadou98@gmail.com";
    if (user.email?.toLowerCase() !== authorizedAdminEmail.toLowerCase()) {
      // User is logged in but not authorized for admin
      const url = request.nextUrl.clone();
      url.pathname = "/compte";
      return NextResponse.redirect(url);
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely.

  return supabaseResponse;
}

