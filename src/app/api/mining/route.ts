import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getUser, tiers, calculateTier } from "@/lib/auth";

export async function POST(_request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const recharge = Number(user.total_recharge);

  if (recharge < 10) {
    return NextResponse.json({ error: "Minimum $10 deposit required to start mining." }, { status: 400 });
  }

  if (user.last_mining_time) {
    const diff = (Date.now() - new Date(user.last_mining_time + (user.last_mining_time.endsWith("Z") ? "" : "Z")).getTime()) / 1000;
    if (diff < 86400) {
      return NextResponse.json({ error: "Miner is cooling down. Wait for the 24h cycle to end." }, { status: 400 });
    }
  }

  const tierId = calculateTier(recharge);
  const tierList = tiers();
  const tier = tierList.find((t) => t.id === tierId);
  const profitRate = tier ? tier.profit / 100 : 0.0175;

  const profit = Number(user.balance) * profitRate;
  const newBalance = Number(user.balance) + profit;

  // The cooldown check above is only advisory: two requests racing here would
  // both pass it. The conditional update below is what actually authorises one
  // single payout, because it only applies if last_mining_time is still the
  // value we read.
  const claim = supabase
    .from("users")
    .update({ balance: newBalance, last_mining_time: new Date().toISOString() })
    .eq("id", user.id);

  const { data: updated, error } = await (user.last_mining_time
    ? claim.eq("last_mining_time", user.last_mining_time)
    : claim.is("last_mining_time", null)
  ).select("id");

  if (error) {
    return NextResponse.json({ error: "Database update failed." }, { status: 500 });
  }

  if (!updated || updated.length === 0) {
    return NextResponse.json(
      { error: "Mining already collected for this cycle." },
      { status: 409 }
    );
  }

  return NextResponse.json({
    status: "success",
    earned: profit.toFixed(2),
    new_balance: newBalance.toFixed(2),
  });
}
