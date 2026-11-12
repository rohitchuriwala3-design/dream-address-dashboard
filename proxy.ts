import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isPartnerAllowedPath } from "@/lib/partner-routes";

const intlMiddleware = createMiddleware(routing);

/**
 * Render proxies public HTTPS traffic to the container's internal PORT. Keep
 * that port out of absolute redirects emitted by next-intl by normalizing
 * page requests to the configured public origin before locale handling.
 */
function normalizePublicPageRequest(req: NextRequest) {
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL;
  if (
    !configuredOrigin ||
    !["GET", "HEAD"].includes(req.method)
  ) {
    return req;
  }

  const publicUrl = new URL(configuredOrigin);
  const requestUrl = req.nextUrl.clone();
  requestUrl.protocol = publicUrl.protocol;
  requestUrl.host = publicUrl.host;

  const headers = new Headers(req.headers);
  headers.set("host", publicUrl.host);
  headers.set("x-forwarded-host", publicUrl.host);
  headers.set("x-forwarded-proto", publicUrl.protocol.slice(0, -1));
  headers.set("x-forwarded-port", publicUrl.port || (publicUrl.protocol === "https:" ? "443" : "80"));

  return new NextRequest(requestUrl, { headers, method: req.method });
}

function sanitizeRedirect(response: NextResponse) {
  const location = response.headers.get("location");
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL;
  if (!location || !configuredOrigin) return response;
  const publicUrl = new URL(configuredOrigin);
  if (publicUrl.port === process.env.PORT) publicUrl.port = "";
  const destination = new URL(location, publicUrl);
  destination.protocol = publicUrl.protocol;
  destination.host = publicUrl.host;
  // Same-origin redirects should remain relative. This avoids leaking the
  // container's internal Render port even if an upstream middleware has
  // already materialized an absolute URL from the forwarded request.
  response.headers.set(
    "location",
    `${destination.pathname}${destination.search}${destination.hash}`,
  );
  return response;
}

// Admin-only API paths — cookie presence checked here, role checked server-side
const ADMIN_ONLY_PATHS = [
  "/api/user/activateAdmin",
  "/api/user/deactivateAdmin",
  "/api/user/activate",
  "/api/user/deactivate",
  "/api/user/inviteuser",
  "/api/admin",
];

// Writes here authenticate with a token or signature of their own, or come
// from mail links; the Origin check below does not apply to them.
// (/api/auth and /api/inngest return before it.)
const ORIGIN_CHECK_EXEMPT = [
  "/api/mcp",
  "/api/campaigns/unsubscribe",
  "/api/crm/leads/create-lead-from-web",
  "/api/crm/contacts/create-from-remote",
];

/**
 * A cookie-authenticated write to /api must come from the app's own origin.
 * A page on a same-site host (files.<domain>) can make the browser send the
 * session cookie, but its Origin is its own. Browsers send Origin on every
 * POST/PUT/PATCH/DELETE fetch, so a missing one is refused too. An
 * Authorization header does not exempt it: token callers (MCP, API tokens)
 * send no session cookie, so they never reach the check.
 */
function isCrossOriginWrite(req: NextRequest, path: string, hasSessionCookie: boolean) {
  if (!hasSessionCookie || ["GET", "HEAD", "OPTIONS"].includes(req.method)) return false;
  if (path.includes("/webhooks/") || ORIGIN_CHECK_EXEMPT.some((p) => path.startsWith(p))) return false;
  const appOrigin = process.env.BETTER_AUTH_URL
    ? new URL(process.env.BETTER_AUTH_URL).origin
    : req.nextUrl.origin;
  return req.headers.get("origin") !== appOrigin;
}

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Inngest webhook — pass through, Inngest handles its own auth via signing key
  if (path.startsWith("/api/inngest")) {
    return NextResponse.next();
  }

  // better-auth API routes — pass through to better-auth handler
  if (path.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const sessionCookie = getSessionCookie(req);

  // Partners get only the routes in lib/partner-routes.ts, refused here on the
  // server for pages and API alike (deny by default). The session is looked up
  // only off the allow-list, so partner pages and cookie-less calls cost nothing.
  if (sessionCookie && !isPartnerAllowedPath(path)) {
    const session = await auth.api.getSession({ headers: req.headers });
    if (session?.user.role === "partner") {
      if (path.startsWith("/api")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return sanitizeRedirect(NextResponse.redirect(new URL("/", req.nextUrl)));
    }
  }

  if (path.startsWith("/api") && isCrossOriginWrite(req, path, !!sessionCookie)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Admin-only routes — require session cookie (role checked server-side)
  if (ADMIN_ONLY_PATHS.some((p) => path.startsWith(p))) {
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Non-API routes — redirect to sign-in if no session cookie
  if (!path.startsWith("/api")) {
    if (!sessionCookie) {
      // Allow auth pages (sign-in, register, pending, inactive)
      const authPaths = ["/sign-in", "/register", "/pending", "/inactive"];
      const isAuthPage = authPaths.some((p) => path.includes(p));
      if (!isAuthPage) {
        const signInUrl = new URL("/sign-in", req.nextUrl);
        signInUrl.searchParams.set("callbackUrl", `${path}${req.nextUrl.search}`);
        return sanitizeRedirect(NextResponse.redirect(signInUrl));
      }
    }
  }

  // Other API routes authenticate themselves
  if (path.startsWith("/api")) {
    return NextResponse.next();
  }

  // Non-API routes — delegate to next-intl
  return sanitizeRedirect(intlMiddleware(normalizePublicPageRequest(req)));
}

export const config = {
  matcher: [
    // Admin-only API paths
    "/api/user/activateAdmin/:path*",
    "/api/user/deactivateAdmin/:path*",
    "/api/user/activate/:path*",
    "/api/user/deactivate/:path*",
    "/api/user/inviteuser",
    "/api/admin/:path*",
    // Every other API route, for the partner allow-list
    "/api/:path*",
    // better-auth API
    "/api/auth/:path*",
    // All non-API routes (existing intl matcher)
    "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
  ],
};
