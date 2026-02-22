import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const authPages = new Set(["/login", "/register"]);

export function middleware(request: NextRequest): NextResponse {
  const token = request.cookies.get("auth_token")?.value;
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = token ? "/diary" : "/login";
    return NextResponse.redirect(url);
  }

  if (!token && pathname.startsWith("/diary")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (token && authPages.has(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/diary";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/register", "/diary/:path*"],
};
