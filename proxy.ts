import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "@/lib/i18n/routing";

const handleI18nRouting = createMiddleware(routing);

export function proxy(request: NextRequest) {
  return handleI18nRouting(request);
}

export const config = {
  // "/ai" is the short link printed on QR codes and shared in person: the
  // middleware redirects it to /en/ai or /es/ai (cookie / Accept-Language),
  // since every page lives under a locale prefix.
  matcher: ["/", "/ai", "/(en|es)/:path*"],
};
