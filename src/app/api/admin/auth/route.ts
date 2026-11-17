import { NextRequest, NextResponse } from "next/server";
import { createAdminToken, ADMIN_COOKIE } from "@/lib/admin-auth";
import { rateLimit, resetRateLimit, clientIp } from "@/lib/rate-limit";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const limit = rateLimit(`admin:${ip}`, MAX_ATTEMPTS, WINDOW_MS);

  if (!limit.allowed) {
    const waitMin = Math.ceil(limit.retryAfterMs / 60000);
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${waitMin}min.` },
      { status: 429 }
    );
  }

  let password = "";
  try {
    const body = await request.json();
    password = typeof body.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return NextResponse.json({ error: "Admin access is not configured." }, { status: 503 });
  }

  if (password !== expected) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  resetRateLimit(`admin:${ip}`);

  const token = await createAdminToken();
  const res = NextResponse.json({ success: true });
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 12 * 60 * 60,
  });
  return res;
}

// The admin cookie is httpOnly, so it can only be cleared server side.
export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return res;
}
