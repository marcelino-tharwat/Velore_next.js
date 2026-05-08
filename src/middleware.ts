import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { normalizeRole } from "@/lib/auth/roles";

export default withAuth(
  function middleware(req) {
    const role = normalizeRole(req.nextauth.token?.role as string | undefined);
    const path = req.nextUrl.pathname;

    if (path.startsWith("/admin") && role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    if (path.startsWith("/api/admin") && role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (path.startsWith("/seller") && role !== "seller") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    if (path.startsWith("/api/seller") && role !== "seller") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (
      /^\/api\/orders\/[^/]+\/status$/.test(path) &&
      role !== "seller"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ req, token }) {
        const path = req.nextUrl.pathname;
        const role = normalizeRole(token?.role as string | undefined);

        if (path.startsWith("/admin")) {
          return !!token && role === "admin";
        }
        if (path.startsWith("/api/admin")) {
          return !!token && role === "admin";
        }
        if (path.startsWith("/seller")) {
          return !!token && role === "seller";
        }
        if (path.startsWith("/api/seller")) {
          return !!token && role === "seller";
        }
        if (/^\/api\/orders\/[^/]+\/status$/.test(path)) {
          return !!token && role === "seller";
        }
        if (path.startsWith("/account")) {
          return !!token;
        }
        return true;
      },
    },
  },
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/seller/:path*",
    "/api/orders/:path*/status",
    "/seller/:path*",
    "/cart/:path*",
    "/account",
    "/account/:path*",
  ],
};
