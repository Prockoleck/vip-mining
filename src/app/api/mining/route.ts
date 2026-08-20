import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getUser, tiers, calculateTier } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const recharge = Number(user.total_recharge);

  if (recharge < 10) {
    return NextResponse.json({ error: "Minimum $10 deposit required to start mining." }, { status: 400 });
  }

  if (user.last_mining_time) {
    const diff = (Date.now() - new Date(user.last_mining_time).getTime()) / 1000;
    if (diff < 86400) {
      return NextResponse.json({ error: "Miner is cooling down. Wait for the 24h cycle to end." }, { status: 400 });
    }
  }

  const tierId = calculateTier(recharge);
  const tierList = tiers();
  const tier = tierList.find((t) => t.id === tierId);
  const profitRate = tier ? tier.profit / 100 : 0.0175;

  const profit = Number(user.balance) * profitRate;

  const { error } = await supabase
    .from("users")
    .update({
      balance: Number(user.balance) + profit,
      last_mining_time: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: "Database update failed." }, { status: 500 });
  }

  return NextResponse.json({
    status: "success",
    earned: profit.toFixed(2),
    new_balance: (Number(user.balance) + profit).toFixed(2),
  });
}
