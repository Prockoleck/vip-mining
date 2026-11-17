import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getUser } from "@/lib/auth";

const MIN_WITHDRAWAL = 10;
const FEE_RATE = 0.10;
const EVM_ADDRESS = /^0x[a-fA-F0-9]{40}$/;

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let payload: { amount?: unknown; address?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const amount = Number(payload.amount);
  const address = typeof payload.address === "string" ? payload.address.trim() : "";

  if (!Number.isFinite(amount)) {
    return NextResponse.json({ error: "Enter a valid amount." }, { status: 400 });
  }

  if (amount < MIN_WITHDRAWAL) {
    return NextResponse.json(
      { error: `Minimum withdrawal is ${MIN_WITHDRAWAL} USDT.` },
      { status: 400 }
    );
  }

  if (!EVM_ADDRESS.test(address)) {
    return NextResponse.json(
      { error: "Enter a valid BEP20 wallet address (0x followed by 40 characters)." },
      { status: 400 }
    );
  }

  // Check referral unlock
  const { data: l1 } = await supabase.from("users").select("id").eq("referrer_id", user.id);
  const l1Count = l1?.length || 0;

  let l2Count = 0;
  if (l1Count > 0) {
    const l1Ids = l1!.map((u) => u.id);
    const { data: l2 } = await supabase.from("users").select("id").in("referrer_id", l1Ids);
    l2Count = l2?.length || 0;
  }

  const principalUnlocked = l1Count >= 3 && l2Count >= 2;
  const withdrawableTotal = principalUnlocked
    ? Number(user.balance)
    : Math.max(0, Number(user.balance) - Number(user.total_recharge));

  if (amount > withdrawableTotal) {
    return NextResponse.json({
      error: principalUnlocked
        ? "Insufficient balance."
        : `Principal is locked. Refer 3 Lvl-1 and 2 Lvl-2 partners. Current limit: $${withdrawableTotal.toFixed(2)}`,
    }, { status: 400 });
  }

  // Check 7-day cooldown
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentWithdrawal } = await supabase
    .from("withdrawals")
    .select("id")
    .eq("user_id", user.id)
    .gt("created_at", sevenDaysAgo)
    .limit(1)
    .maybeSingle();

  if (recentWithdrawal) {
    return NextResponse.json({ error: "Withdrawal allowed once every 7 days." }, { status: 400 });
  }

  const fee = amount * FEE_RATE;

  // Debit first, guarded on the balance we just validated. Two concurrent
  // requests would otherwise both read the same balance and both succeed.
  const { data: debited } = await supabase
    .from("users")
    .update({ balance: Number(user.balance) - amount })
    .eq("id", user.id)
    .eq("balance", user.balance)
    .select("id");

  if (!debited || debited.length === 0) {
    return NextResponse.json(
      { error: "Your balance changed. Please review and try again." },
      { status: 409 }
    );
  }

  const { error: insError } = await supabase.from("withdrawals").insert({
    user_id: user.id,
    wallet_address: address,
    amount,
    fee,
    status: "pending",
    created_at: new Date().toISOString(),
  });

  if (insError) {
    // Give the money back so a failed insert never silently keeps funds.
    const { data: now } = await supabase
      .from("users")
      .select("balance")
      .eq("id", user.id)
      .single();

    if (now) {
      await supabase
        .from("users")
        .update({ balance: Number(now.balance) + amount })
        .eq("id", user.id);
    }

    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
