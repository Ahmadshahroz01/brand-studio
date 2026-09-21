import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const protectedProxy = auth((req) => {
  const isLoggedIn = !!req.auth;
  const isProtected =
    req.nextUrl.pathname.startsWith("/dashboard") ||
    req.nextUrl.pathname.startsWith("/onboarding");

  if (isProtected && !isLoggedIn) {
    const signInUrl = new URL("/", req.nextUrl.origin);
    return NextResponse.redirect(signInUrl);
  }
});

// Testing-only bypass, see getSession() in src/lib/auth.ts. Skips the
// auth check entirely so /dashboard and /onboarding are reachable without
// a real sign-in.
export default function proxy(...args: Parameters<typeof protectedProxy>) {
  if (process.env.DEV_BYPASS_AUTH === "true") {
    return NextResponse.next();
  }
  return protectedProxy(...args);
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*"],
};
