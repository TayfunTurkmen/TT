import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

function applySecurityHeaders(response: NextResponse) {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
}

function pickLocaleFromGeo(request: NextRequest): "en" | "tr" {
  const countryHeader =
    request.headers.get("cf-ipcountry") ??
    request.headers.get("x-vercel-ip-country") ??
    request.headers.get("x-country-code");

  if (countryHeader?.toUpperCase() === "TR") {
    return "tr";
  }

  return "en";
}

export default function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/") {
    const locale = pickLocaleFromGeo(request);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}`;
    const redirectResponse = NextResponse.redirect(url);
    applySecurityHeaders(redirectResponse);
    return redirectResponse;
  }

  const response = intlMiddleware(request);

  if (response instanceof NextResponse) {
    applySecurityHeaders(response);
  }

  return response;
}

export const config = {
  matcher: ["/", "/(en|tr)/:path*", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
