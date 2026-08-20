import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { hashPassword, createToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { username, password, referrerCode } = await request.json();

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password required" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("username", username)
    .single();

  if (existing) {
    return NextResponse.json({ error: "Username already taken!" }, { status: 409 });
  }

  let referrerId = 0;
  if (referrerCode) {
    const { data: referrer } = await supabase
      .from("users")
      .select("id")
      .eq("referral_code", referrerCode)
      .single();
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
    return NextResponse.json({ error: "System Error." }, { status: 500 });
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
