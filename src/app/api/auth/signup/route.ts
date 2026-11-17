import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { hashPassword, createToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  let payload: { username?: unknown; password?: unknown; referrerCode?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const username = typeof payload.username === "string" ? payload.username.trim() : "";
  const password = typeof payload.password === "string" ? payload.password : "";
  const referrerCode =
    typeof payload.referrerCode === "string" ? payload.referrerCode.trim() : "";

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password required" }, { status: 400 });
  }

  if (username.length < 3 || username.length > 20) {
    return NextResponse.json(
      { error: "Username must be between 3 and 20 characters." },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters." },
      { status: 400 }
    );
  }

  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Username already taken!" }, { status: 409 });
  }

  let referrerId = 0;
  if (referrerCode) {
    const { data: referrer } = await supabase
      .from("users")
      .select("id")
      .eq("referral_code", referrerCode)
      .maybeSingle();
    if (referrer) referrerId = referrer.id;
  }

  const hashedPass = await hashPassword(password);
  const refCode = Math.random().toString(36).substring(2, 10);

  const { data: newUser, error } = await supabase
    .from("users")
    .insert({
      username,
      password: hashedPass,
      referral_code: refCode,
      referrer_id: referrerId,
      balance: 0,
      total_recharge: 0,
    })
    .select("id, username")
    .single();

  if (error) {
    // A concurrent signup with the same name trips the unique constraint.
    return NextResponse.json({ error: "Username already taken!" }, { status: 409 });
  }

  const token = await createToken(newUser.id, newUser.username);

  const response = NextResponse.json({ success: true, user: newUser });
  response.cookies.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return response;
}
