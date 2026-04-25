import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const IS_PLACEHOLDER = !SUPABASE_URL || SUPABASE_URL.includes("your-project");

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only guard /admin routes (not /admin-login which is the entry point)
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // ─── Demo / mock mode (Supabase not configured) ───────────────────────────
  // Access is granted via a signed cookie set by /api/admin-auth.
  // Direct-URL visitors without the cookie are sent to /dashboard.
  if (IS_PLACEHOLDER) {
    const expectedValue = process.env.ADMIN_COOKIE_VALUE ?? "fleetos-admin-ok";
    const adminCookie = req.cookies.get("fleetos-admin");
    if (adminCookie?.value === expectedValue) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // ─── Production mode (real Supabase) ──────────────────────────────────────
  // Read the session from Supabase and verify the user has role="admin" in
  // either user_metadata or app_metadata.
  const res = NextResponse.next();

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (cookiesToSet) =>
        cookiesToSet.forEach(({ name, value, options }) =>
          res.cookies.set(name, value, options)
        ),
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role =
    (user.user_metadata as Record<string, string>)?.role ??
    (user.app_metadata as Record<string, string>)?.role;

  if (role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return res;
}

export const config = {
  // Match /admin and all sub-paths, but NOT /admin-login
  matcher: ["/admin", "/admin/:path*"],
};
