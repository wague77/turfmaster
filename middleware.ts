import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get("turfmaster_session");
  const { pathname } = request.nextUrl;

  // Protect root / and /calculatrice
  if (pathname === "/" || pathname === "/calculatrice") {
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.redirect(new URL("/acces", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/calculatrice"],
};
