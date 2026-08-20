import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const recharge = Number(user.total_recharge);

  if (recharge < 100) {
    return NextResponse.json({ error: "Minimum $100 recharge required to start mining." }, { status: 400 });
  }

  if (user.last_mining_time) {
    const diff = (Date.now() - new Date(user.last_mining_time).getTime()) / 1000;
    if (diff < 86400) {
      return NextResponse.json({ error: "Miner is cooling down. Wait for the 24h cycle to end." }, { status: 400 });
    }
  }

  let profitRate = 0.02;
  if (recharge >= 10000) profitRate = 0.07;
  else if (recharge >= 5000) profitRate = 0.06;
  else if (recharge >= 3000) profitRate = 0.05;
  else if (recharge >= 1000) profitRate = 0.04;
  else if (recharge >= 500) profitRate = 0.035;
  else if (recharge >= 400) profitRate = 0.03;
  else if (recharge >= 300) profitRate = 0.025;
  else if (recharge >= 200) profitRate = 0.0225;

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
