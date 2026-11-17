import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { isAdmin } from "@/lib/admin-auth";

async function addCommission(userId: number, amount: number, rate: number, label: string) {
  const comm = amount * rate;
  if (comm <= 0) return;

  const { data: u } = await supabase
    .from("users")
    .select("balance, withdrawable_profit")
    .eq("id", userId)
    .single();

  if (!u) return;

  await supabase
    .from("users")
    .update({
      balance: Number(u.balance) + comm,
      withdrawable_profit: Number(u.withdrawable_profit) + comm,
    })
    .eq("id", userId);

  console.log(`${label} commission $${comm.toFixed(2)} -> user ${userId}`);
}

async function payReferralChain(userId: number, amount: number) {
  const { data: owner } = await supabase
    .from("users")
    .select("referrer_id")
    .eq("id", userId)
    .single();

  if (!owner || !owner.referrer_id || owner.referrer_id <= 0) return;

  // Level 1 (5%)
  await addCommission(owner.referrer_id, amount, 0.05, "L1");

  const { data: l1 } = await supabase
    .from("users")
    .select("referrer_id")
    .eq("id", owner.referrer_id)
    .single();

  if (!l1 || !l1.referrer_id || l1.referrer_id <= 0) return;

  // Level 2 (3%)
  await addCommission(l1.referrer_id, amount, 0.03, "L2");

  const { data: l2 } = await supabase
    .from("users")
    .select("referrer_id")
    .eq("id", l1.referrer_id)
    .single();

  if (!l2 || !l2.referrer_id || l2.referrer_id <= 0) return;

  // Level 3 (1%)
  await addCommission(l2.referrer_id, amount, 0.01, "L3");
}

export async function GET(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: totalLiq } = await supabase.from("users").select("balance");
  const totalBalance = totalLiq?.reduce((sum, u) => sum + Number(u.balance), 0) || 0;

  const { count: pendingD } = await supabase
    .from("deposits")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");
  const { count: pendingW } = await supabase
    .from("withdrawals")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  const { data: allUsers } = await supabase
    .from("users")
    .select("id, username, balance, total_recharge")
    .order("balance", { ascending: false });
  const { data: allDeposits } = await supabase
    .from("deposits")
    .select("*, users!inner(username)")
    .order("created_at", { ascending: false })
    .limit(50);
  const { data: allWithdrawals } = await supabase
    .from("withdrawals")
    .select("*, users!inner(username)")
    .order("created_at", { ascending: false })
    .limit(50);

  return NextResponse.json({
    totalBalance,
    pendingDeposits: pendingD || 0,
    pendingWithdrawals: pendingW || 0,
    users: allUsers || [],
    deposits: allDeposits || [],
    withdrawals: allWithdrawals || [],
  });
}

// State-changing actions must be POST so a link or image on another site
// cannot trigger them using the admin's cookie.
export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let action: string | null = null;
  let id: string | null = null;
  try {
    const body = await request.json();
    action = body.action ?? null;
    id = body.id != null ? String(body.id) : null;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!action || !id) {
    return NextResponse.json({ error: "Missing action or id" }, { status: 400 });
  }

  if (action === "approve_dep") {
    // Claim the deposit first. The status guard makes this atomic, so a
    // double click can only ever credit the balance once.
    const { data: claimed } = await supabase
      .from("deposits")
      .update({ status: "approved" })
      .eq("id", id)
      .eq("status", "pending")
      .select("id, user_id, amount");

    if (!claimed || claimed.length === 0) {
      return NextResponse.json({ success: false, reason: "already_processed" });
    }

    const dep = claimed[0];
    const amt = Number(dep.amount);

    const { data: u } = await supabase
      .from("users")
      .select("balance, total_recharge")
      .eq("id", dep.user_id)
      .single();

    if (u) {
      await supabase
        .from("users")
        .update({
          balance: Number(u.balance) + amt,
          total_recharge: Number(u.total_recharge) + amt,
        })
        .eq("id", dep.user_id);
    }

    await payReferralChain(dep.user_id, amt);

    return NextResponse.json({ success: true });
  }

  if (action === "reject_dep") {
    const { data: rejected } = await supabase
      .from("deposits")
      .update({ status: "rejected" })
      .eq("id", id)
      .eq("status", "pending")
      .select("id");

    return NextResponse.json({
      success: !!(rejected && rejected.length > 0),
      reason: rejected && rejected.length > 0 ? undefined : "already_processed",
    });
  }

  if (action === "approve_wit") {
    const { data: approved } = await supabase
      .from("withdrawals")
      .update({ status: "approved" })
      .eq("id", id)
      .eq("status", "pending")
      .select("id");

    return NextResponse.json({
      success: !!(approved && approved.length > 0),
      reason: approved && approved.length > 0 ? undefined : "already_processed",
    });
  }

  if (action === "reject_wit") {
    // Claim first so a concurrent second request cannot refund twice.
    const { data: rejected } = await supabase
      .from("withdrawals")
      .update({ status: "rejected" })
      .eq("id", id)
      .eq("status", "pending")
      .select("id, user_id, amount");

    if (!rejected || rejected.length === 0) {
      return NextResponse.json({ success: false, reason: "already_processed" });
    }

    const wit = rejected[0];
    const { data: u } = await supabase
      .from("users")
      .select("balance")
      .eq("id", wit.user_id)
      .single();

    if (u) {
      await supabase
        .from("users")
        .update({ balance: Number(u.balance) + Number(wit.amount) })
        .eq("id", wit.user_id);
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
