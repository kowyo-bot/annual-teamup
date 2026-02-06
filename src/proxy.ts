import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Ensure cookies/session stay on the canonical production domain.
const CANONICAL_HOST = "annual-teamup.vercel.app";

export default function proxy(req: NextRequest) {
  const host = req.headers.get("host") ?? "";

  // Only enforce in Vercel production.
  if (process.env.VERCEL_ENV === "production") {
    if (host && host !== CANONICAL_HOST) {
      const url = req.nextUrl.clone();
      url.host = CANONICAL_HOST;
      url.protocol = "https:";
      return NextResponse.redirect(url, 308);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)",
  ],
};
