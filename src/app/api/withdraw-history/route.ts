import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getUser } from "@/lib/auth";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: withdrawals } = await supabase
    .from("withdrawals")
    .select("amount, fee, status, wallet_address, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const { data: sumData } = await supabase
    .from("withdrawals")
    .select("amount, fee")
    .eq("user_id", user.id)
    .eq("status", "approved");

  const totalPaid = sumData?.reduce((sum, w) => sum + (Number(w.amount) - Number(w.fee)), 0) || 0;

  return NextResponse.json({ withdrawals: withdrawals || [], total_paid: totalPaid });
}
