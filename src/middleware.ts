import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/api/auth/login",
  "/api/auth/signup",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/market") ||
    pathname === "/" ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/logo")
  ) {
    return NextResponse.next();
  }

  const protectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/api/portfolio") ||
    pathname.startsWith("/api/trade") ||
    pathname.startsWith("/api/holdings") ||
    pathname.startsWith("/api/transactions") ||
    pathname.startsWith("/api/watchlist") ||
    pathname.startsWith("/api/ai") ||
    pathname.startsWith("/api/leaderboard") ||
    pathname.startsWith("/api/user") ||
    pathname.startsWith("/api/auth/me");

  if (!protectedRoute) {
    return NextResponse.next();
  }

  const token = req.cookies.get("gt_token")?.value;

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    await verifyToken(token);
    return NextResponse.next();
  } catch {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete("gt_token");
    return res;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.png).*)"],
};