import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const path = req.nextUrl.pathname;
  const isAuthRoute = path.startsWith("/auth");
  const isApiAuth = path.startsWith("/api/auth");

  if (isApiAuth) return NextResponse.next();
  if (isAuthRoute) return NextResponse.next();
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
