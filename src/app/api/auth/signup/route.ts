import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { hashPassword, createToken } from "@/lib/auth";

const LEVEL4_BONUS = 0.25;
const CODE_ALPHABET = "abcdefghijkmnopqrstuvwxyz23456789";
const CODE_LENGTH = 8;

function randomReferralCode() {
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

async function allocateReferralCode() {
  for (let attempt = 0; attempt < 6; attempt++) {
    const candidate = randomReferralCode();
    const { data: taken } = await supabase
      .from("users")
      .select("id")
      .eq("referral_code", candidate)
      .maybeSingle();
    if (!taken) return candidate;
  }
  return null;
}

// The Team page advertises a flat $0.25 for every Level-4 member, so the
// commission has to actually be paid when that member joins.
async function payLevel4Bonus(referrerId: number) {
  let currentId = referrerId;

  for (let depth = 1; depth <= 4; depth++) {
    if (!currentId || currentId <= 0) return;

    if (depth === 4) {
      const { data: upline } = await supabase
        .from("users")
        .select("balance, withdrawable_profit")
        .eq("id", currentId)
        .maybeSingle();

      if (!upline) return;

      await supabase
        .from("users")
        .update({
          balance: Number(upline.balance) + LEVEL4_BONUS,
          withdrawable_profit: Number(upline.withdrawable_profit) + LEVEL4_BONUS,
        })
        .eq("id", currentId);
      return;
    }

    const { data: next } = await supabase
      .from("users")
      .select("referrer_id")
      .eq("id", currentId)
      .maybeSingle();

    currentId = next?.referrer_id ?? 0;
  }
}

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

  const refCode = await allocateReferralCode();
  if (!refCode) {
    return NextResponse.json(
      { error: "Could not create an account right now. Please try again." },
      { status: 503 }
    );
  }

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
    if (error.code === "23505") {
      return NextResponse.json({ error: "Username already taken!" }, { status: 409 });
    }
    return NextResponse.json({ error: "System Error." }, { status: 500 });
  }

  if (referrerId > 0) {
    // Failure here must not block the signup itself.
    try {
      await payLevel4Bonus(referrerId);
    } catch (e) {
      console.error("Level 4 bonus failed for new user", newUser.id, e);
    }
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
