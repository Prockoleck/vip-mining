import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getUser } from "@/lib/auth";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Referral counts
  const { data: l1 } = await supabase.from("users").select("id").eq("referrer_id", user.id);
  const l1Count = l1?.length || 0;
  let l2Count = 0;
  if (l1Count > 0) {
    const l1Ids = l1!.map((u: { id: number }) => u.id);
    const { data: l2 } = await supabase.from("users").select("id").in("referrer_id", l1Ids);
    l2Count = l2?.length || 0;
  }
  const principalUnlocked = l1Count >= 3 && l2Count >= 2;
  const withdrawableTotal = principalUnlocked
    ? Number(user.balance)
    : Math.max(0, Number(user.balance) - Number(user.total_recharge));

  return NextResponse.json({
    ...user,
    l1_count: l1Count,
    l2_count: l2Count,
    principal_unlocked: principalUnlocked,
    withdrawable_total: withdrawableTotal,
  });
}
