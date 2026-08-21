import { NextRequest, NextResponse } from "next/server";
import { createAdminToken, ADMIN_COOKIE } from "@/lib/admin-auth";

const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

function getClientIP(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);

  const now = Date.now();
  const record = attempts.get(ip);
  if (record && now < record.resetAt && record.count >= MAX_ATTEMPTS) {
    const waitMin = Math.ceil((record.resetAt - now) / 60000);
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${waitMin}min.` },
      { status: 429 }
    );
  }

  if (!record || now >= record.resetAt) {
    attempts.set(ip, { count: 0, resetAt: now + WINDOW_MS });
  }

  const { password } = await request.json();
  if (password !== process.env.ADMIN_PASSWORD) {
    const r = attempts.get(ip)!;
    r.count++;
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  attempts.delete(ip);

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
