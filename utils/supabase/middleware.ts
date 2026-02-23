import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ============================================
  // 301 Redirects for deprecated routes
  // Added by WORKFLOW_PROPOSAL.md implementation
  // ============================================

  // Redirect /gestion-locative/* → /gestion/* (permanent 301)
  // /gestion-locative is a legacy duplicate that should be removed
  if (pathname.startsWith("/gestion-locative")) {
    const newPath = pathname.replace("/gestion-locative", "/gestion");
    const url = request.nextUrl.clone();
    url.pathname = newPath;
    return NextResponse.redirect(url, 301);
  }

  // Redirect /landing/* → /pro/* (permanent 301)
  // /landing is being renamed to /pro for better branding
  if (pathname.startsWith("/landing")) {
    let newPath = pathname.replace("/landing", "/pro");
    // Also handle /landing/commencer → /pro/start
    if (newPath === "/pro/commencer") {
      newPath = "/pro/start";
    }
    const url = request.nextUrl.clone();
    url.pathname = newPath;
    return NextResponse.redirect(url, 301);
  }

  // Redirect legacy paths
  if (pathname.startsWith("/etats-lieux") && !pathname.startsWith("/gestion/etats-lieux")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace("/etats-lieux", "/gestion/etats-lieux");
    return NextResponse.redirect(url, 301);
  }

  if (pathname.startsWith("/interventions") && !pathname.startsWith("/gestion/interventions")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace("/interventions", "/gestion/interventions");
    return NextResponse.redirect(url, 301);
  }

  // ============================================
  // End of 301 Redirects
  // ============================================

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
  let retryCount = 0;
  const maxRetries = 2;

  while (retryCount <= maxRetries) {
    try {
      const {
        data: { user: authUser },
        error: authError
      } = await supabase.auth.getUser();

      if (authError) {
        // Silence common session expiration errors and generic fetch failures
        const isSessionExpired = authError.message?.includes("refresh_token_not_found") ||
          authError.status === 400 ||
          authError.message?.includes("Refresh Token Not Found");

        const isFetchFailed = authError.message?.toLowerCase().includes("fetch failed");

        if (!isSessionExpired && !isFetchFailed) {
          console.warn(`Middleware: Auth error (attempt ${retryCount + 1}):`, authError.message);
        }

        if (isFetchFailed && retryCount < maxRetries) {
          retryCount++;
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, retryCount)));
          continue;
        }
      }

      user = authUser;
      break; // Success or non-retryable error
    } catch (error: any) {
      const isFetchFailed = error.message?.toLowerCase().includes("fetch failed");
      if (isFetchFailed && retryCount < maxRetries) {
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, retryCount)));
        continue;
      }
      console.debug("Middleware: Unexpected error getting user:", error);
      break;
    }
  }

  // ============================================
  // Tenant Routes Protection (Magic Link based)
  // Handled SEPARATELY from auth.users routes
  // Per WORKFLOW_PROPOSAL.md section 5.4
  // ============================================

  if (pathname.startsWith("/locataire")) {
    // Allow access to expired and verify pages without token
    if (pathname === "/locataire/expired" || pathname.startsWith("/locataire/verify")) {
      return supabaseResponse;
    }

    // Check for tenant session cookie or URL token
    const tenantSessionCookie = request.cookies.get("tenant_session")?.value;
    const urlToken = request.nextUrl.searchParams.get("token");

    // If URL has token, let the page handle verification
    // The verify page will create the session cookie after identity check
    if (urlToken) {
      // Don't validate here - let the page handle it
      // This allows the verify page to work
      return supabaseResponse;
    }

    // If no token and no session cookie, redirect to expired
    if (!tenantSessionCookie) {
      return NextResponse.redirect(new URL("/locataire/expired", request.url));
    }

    // Session cookie exists - continue (token validation is done in pages)
    // We trust the HttpOnly cookie here, full validation happens server-side
    return supabaseResponse;
  }

  // ============================================
  // Owner Routes Protection (auth.users ONLY)
  // Per WORKFLOW_PROPOSAL.md section 3.5.5:
  // - Tenants (with only tenant_session) → redirect to /locataire
  // - Users with auth.users → allowed (handled by standard protection)
  // Routes: /compte, /gestion
  // ============================================

  const ownerOnlyPaths = ["/compte", "/gestion"];
  const isOwnerOnlyRoute = ownerOnlyPaths.some(path => pathname.startsWith(path));

  if (isOwnerOnlyRoute) {
    const tenantSessionCookie = request.cookies.get("tenant_session")?.value;

    // If someone has a tenant session but NO auth.users session,
    // they're a pure tenant trying to access owner routes → redirect to /locataire
    if (tenantSessionCookie && !user) {
      return NextResponse.redirect(new URL("/locataire", request.url));
    }

    // If no user at all (no tenant session, no auth.users),
    // they'll be caught by the standard protected routes check below
  }

  // ============================================
  // Standard Protected Routes (auth.users based)
  // ============================================

  // Routes protégées (workspace) - EXCLUDING /locataire which is handled above
  const protectedPaths = [
    "/compte",
    "/admin",
    "/gestion",        // Nouveau chemin workspace
    "/gestion-locative", // Legacy (sera redirigé)
    "/etats-lieux",      // Legacy (sera redirigé)
    "/interventions",    // Legacy (sera redirigé)
  ];

  const isProtectedRoute = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (
    !user &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/register") &&
    !request.nextUrl.pathname.startsWith("/auth") &&
    isProtectedRoute
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  // If the user is logged in and tries to access login/register, redirect to account (or intended redirect)
  // CRITICAL: Skip this check if it's a Server Action (Next-Action header present)
  // otherwise it breaks actions called from these pages (like determinePostLoginRedirect)
  const isAction = request.headers.has('next-action');

  if (
    user && !isAction &&
    (request.nextUrl.pathname.startsWith("/login") ||
      request.nextUrl.pathname.startsWith("/register"))
  ) {
    const redirectParam = request.nextUrl.searchParams.get("redirect");
    const url = request.nextUrl.clone();

    if (redirectParam && redirectParam.startsWith("/")) {
      url.pathname = redirectParam;
      // Clean up the search params to avoid infinite loops if it redirects back to login
      url.searchParams.delete("redirect");
    } else {
      url.pathname = "/compte";
    }

    return NextResponse.redirect(url);
  }

  // Admin access restriction: check email (fallback) or let pages handle role-based auth
  // Note: Full role checking is done in server pages via requireAdmin() for performance
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!user) {
      // Already handled above, but double check
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", request.nextUrl.pathname + request.nextUrl.search);
      return NextResponse.redirect(url);
    }

    // Fallback: Check if user email is authorized for admin access
    // Full role checking is done in server pages for better performance
    const authorizedAdminEmail = process.env.ADMIN_EMAIL ?? "";
    const isAuthorizedEmail = authorizedAdminEmail && user.email?.toLowerCase() === authorizedAdminEmail.toLowerCase();

    // If not authorized by email, let the server page handle role-based auth
    // This allows role-based access while maintaining email fallback
    if (!isAuthorizedEmail) {
      // Let server pages check roles - they will redirect if not authorized
      // This is more performant than checking roles in middleware on every request
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

