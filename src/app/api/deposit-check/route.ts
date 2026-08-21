import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getUser } from "@/lib/auth";
import { getRecentUsdtTransfers, IS_MOCK } from "@/lib/bscscan";

const AMOUNT_TOLERANCE = 0.5;
const EXPIRY_MINUTES = 30;

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: pending } = await supabase
    .from("deposits")
    .select("id, amount, created_at")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(5);

  if (!pending || pending.length === 0) {
    return NextResponse.json({ status: "no_pending" });
  }

  const transfers = await getRecentUsdtTransfers();

  for (const deposit of pending) {
    const depositTime = new Date(deposit.created_at + (deposit.created_at.endsWith("Z") ? "" : "Z")).getTime() / 1000;
    const expiryTime = depositTime + EXPIRY_MINUTES * 60;
    const now = Date.now() / 1000;

    if (now > expiryTime) continue;

    const depositAmount = Number(deposit.amount);

    for (const tx of transfers) {
      if (tx.timestamp < depositTime - 30) continue;
      if (tx.timestamp > expiryTime) continue;

      const txAmount = Number(tx.value) / 1e18;
      if (Math.abs(txAmount - depositAmount) <= AMOUNT_TOLERANCE) {
        await supabase
          .from("deposits")
          .update({ status: "approved" })
          .eq("id", deposit.id);

        const { data: current } = await supabase
          .from("users")
          .select("balance, total_recharge")
          .eq("id", user.id)
          .single();

        if (current) {
          await supabase
            .from("users")
            .update({
              balance: Number(current.balance) + depositAmount,
              total_recharge: Number(current.total_recharge) + depositAmount,
            })
            .eq("id", user.id);
        }

        return NextResponse.json({
          status: "approved",
          deposit_id: deposit.id,
          amount: depositAmount,
          mock: IS_MOCK,
        });
      }
    }
  }

  const secondsLeft = Math.max(
    0,
    ...pending.map((d) => {
      const created = new Date(d.created_at + (d.created_at.endsWith("Z") ? "" : "Z")).getTime() / 1000;
      return EXPIRY_MINUTES * 60 - (Date.now() / 1000 - created);
    })
  );

  return NextResponse.json({
    status: "waiting",
    seconds_left: Math.floor(secondsLeft),
    mock: IS_MOCK,
  });
}
