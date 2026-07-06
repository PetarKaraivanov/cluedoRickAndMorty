import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE } from "./lib/auth-shared";

const VALID_UNAUTH_PATHS = ["/login"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const cookie = req.cookies.get(AUTH_COOKIE)?.value;
  const parts = cookie ? cookie.split(".") : [];
  const isAuthed =
    parts.length === 3 &&
    parts[0] === "auth" &&
    Number(parts[1]) > Math.floor(Date.now() / 1000);

  if (!isAuthed && !VALID_UNAUTH_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  if (isAuthed && pathname === "/login") {
    const url = req.nextUrl.clone();
    url.pathname = "/lobby";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|placeholders|api).*)"],
};
