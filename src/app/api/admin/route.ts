import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { isAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  const id = searchParams.get("id");

  if (action === "approve_dep" && id) {
    const { data: dep } = await supabase
      .from("deposits")
      .select("*")
      .eq("id", id)
      .eq("status", "pending")
      .single();

    if (dep) {
      const uid = dep.user_id;
      const amt = Number(dep.amount);

      // Update depositor balance
      const { data: u } = await supabase.from("users").select("balance, total_recharge").eq("id", uid).single();
      await supabase.from("users").update({
        balance: Number(u!.balance) + amt,
        total_recharge: Number(u!.total_recharge) + amt,
      }).eq("id", uid);

      // Level 1 commission (5%)
      const { data: uInfo } = await supabase.from("users").select("referrer_id").eq("id", uid).single();
      if (uInfo && uInfo.referrer_id > 0) {
        const commA = amt * 0.05;
        const { data: refA } = await supabase.from("users").select("balance, withdrawable_profit").eq("id", uInfo.referrer_id).single();
        if (refA) {
          await supabase.from("users").update({
            balance: Number(refA.balance) + commA,
            withdrawable_profit: Number(refA.withdrawable_profit) + commA,
          }).eq("id", uInfo.referrer_id);

          // Level 2 commission (3%)
          const { data: uInfoB } = await supabase.from("users").select("referrer_id").eq("id", uInfo.referrer_id).single();
          if (uInfoB && uInfoB.referrer_id > 0) {
            const commB = amt * 0.03;
            const { data: refB } = await supabase.from("users").select("balance, withdrawable_profit").eq("id", uInfoB.referrer_id).single();
            if (refB) {
              await supabase.from("users").update({
                balance: Number(refB.balance) + commB,
                withdrawable_profit: Number(refB.withdrawable_profit) + commB,
              }).eq("id", uInfoB.referrer_id);

              // Level 3 commission (1%)
              const { data: uInfoC } = await supabase.from("users").select("referrer_id").eq("id", uInfoB.referrer_id).single();
              if (uInfoC && uInfoC.referrer_id > 0) {
                const commC = amt * 0.01;
                const { data: refC } = await supabase.from("users").select("balance, withdrawable_profit").eq("id", uInfoC.referrer_id).single();
                if (refC) {
                  await supabase.from("users").update({
                    balance: Number(refC.balance) + commC,
                    withdrawable_profit: Number(refC.withdrawable_profit) + commC,
                  }).eq("id", uInfoC.referrer_id);
                }
              }
            }
          }
        }
      }

      await supabase.from("deposits").update({ status: "approved" }).eq("id", id);
    }
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (action === "reject_dep" && id) {
    await supabase.from("deposits").update({ status: "rejected" }).eq("id", id);
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (action === "approve_wit" && id) {
    await supabase.from("withdrawals").update({ status: "approved" }).eq("id", id);
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (action === "reject_wit" && id) {
    const { data: wit } = await supabase
      .from("withdrawals")
      .select("*")
      .eq("id", id)
      .eq("status", "pending")
      .single();

    if (wit) {
      const { data: u } = await supabase.from("users").select("balance").eq("id", wit.user_id).single();
      if (u) {
        await supabase.from("users").update({ balance: Number(u.balance) + Number(wit.amount) }).eq("id", wit.user_id);
      }
      await supabase.from("withdrawals").update({ status: "rejected" }).eq("id", id);
    }
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // Fetch data for admin dashboard
  const { data: totalLiq } = await supabase.from("users").select("balance");
  const totalBalance = totalLiq?.reduce((sum, u) => sum + Number(u.balance), 0) || 0;

  const { count: pendingD } = await supabase.from("deposits").select("*", { count: "exact", head: true }).eq("status", "pending");
  const { count: pendingW } = await supabase.from("withdrawals").select("*", { count: "exact", head: true }).eq("status", "pending");

  const { data: allUsers } = await supabase.from("users").select("id, username, balance, total_recharge").order("balance", { ascending: false });
  const { data: allDeposits } = await supabase.from("deposits").select("*, users!inner(username)").order("created_at", { ascending: false }).limit(50);
  const { data: allWithdrawals } = await supabase.from("withdrawals").select("*, users!inner(username)").order("created_at", { ascending: false }).limit(50);

  return NextResponse.json({
    totalBalance,
    pendingDeposits: pendingD || 0,
    pendingWithdrawals: pendingW || 0,
    users: allUsers || [],
    deposits: allDeposits || [],
    withdrawals: allWithdrawals || [],
  });
}
