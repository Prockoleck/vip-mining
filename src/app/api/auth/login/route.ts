import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyPassword, createToken } from "@/lib/auth";
import { rateLimit, resetRateLimit, clientIp } from "@/lib/rate-limit";

const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const limit = await rateLimit(`login:${ip}`, MAX_ATTEMPTS, WINDOW_MS);

  if (!limit.allowed) {
    const minutes = Math.ceil(limit.retryAfterMs / 60000);
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.` },
      { status: 429 }
    );
  }

  let payload: { username?: unknown; password?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const username = typeof payload.username === "string" ? payload.username.trim() : "";
  const password = typeof payload.password === "string" ? payload.password : "";

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password required" }, { status: 400 });
  }

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .maybeSingle();

  // Same message for both cases so this cannot be used to enumerate accounts.
  if (!user) {
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  await resetRateLimit(`login:${ip}`);

  const token = await createToken(user.id, user.username);

  const response = NextResponse.json({ success: true, user: { id: user.id, username: user.username } });
  response.cookies.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return response;
}
