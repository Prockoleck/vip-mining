import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getUser } from "@/lib/auth";

const MIN_DEPOSIT = 10;
const MAX_DEPOSIT = 1_000_000;

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let payload: { amount?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const amount = Number(payload.amount);
  if (!Number.isFinite(amount)) {
    return NextResponse.json({ error: "Enter a valid amount." }, { status: 400 });
  }

  if (amount < MIN_DEPOSIT) {
    return NextResponse.json({ error: `Minimum deposit is ${MIN_DEPOSIT} USDT.` }, { status: 400 });
  }

  if (amount > MAX_DEPOSIT) {
    return NextResponse.json({ error: "Amount is too large." }, { status: 400 });
  }

  const rounded = Math.round(amount * 100) / 100;

  const { error } = await supabase
    .from("deposits")
    .insert({
      user_id: user.id,
      amount: rounded,
      status: "pending",
      created_at: new Date().toISOString(),
    });

  if (error) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
