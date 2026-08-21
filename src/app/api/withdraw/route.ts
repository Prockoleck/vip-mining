import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { amount, address } = await request.json();

  if (!amount || amount < 10) {
    return NextResponse.json({ error: "Minimum withdrawal is 10 USDT." }, { status: 400 });
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
    .single();

  if (recentWithdrawal) {
    return NextResponse.json({ error: "Withdrawal allowed once every 7 days." }, { status: 400 });
  }

  const fee = amount * 0.05;

  const { error: insError } = await supabase.from("withdrawals").insert({
    user_id: user.id,
    wallet_address: address,
    amount,
    fee,
    status: "pending",
    created_at: new Date().toISOString(),
  });

  if (insError) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  await supabase
    .from("users")
    .update({ balance: Number(user.balance) - amount })
    .eq("id", user.id);

  return NextResponse.json({ success: true });
}
