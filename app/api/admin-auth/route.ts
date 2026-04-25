import { NextRequest, NextResponse } from "next/server";

const ADMIN_SECRET = process.env.ADMIN_SECRET ?? "fleetos-admin-2024";
const COOKIE_VALUE = process.env.ADMIN_COOKIE_VALUE ?? "fleetos-admin-ok";
const COOKIE_NAME = "fleetos-admin";

// POST /api/admin-auth  { secret: string }
// Sets the admin session cookie if the secret matches.
export async function POST(req: NextRequest) {
  let body: { secret?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.secret || body.secret !== ADMIN_SECRET) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, COOKIE_VALUE, {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    // 8-hour session for the admin cookie
    maxAge: 60 * 60 * 8,
    // Only mark secure in a real deployment
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}

// DELETE /api/admin-auth
// Clears the admin session cookie (sign out from admin panel).
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return res;
}
