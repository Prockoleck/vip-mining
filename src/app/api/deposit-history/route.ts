import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getUser } from "@/lib/auth";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: deposits } = await supabase
    .from("deposits")
    .select("amount, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const { data: sumData } = await supabase
    .from("deposits")
    .select("amount")
    .eq("user_id", user.id)
    .eq("status", "approved");

  const totalApproved = sumData?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;

  return NextResponse.json({ deposits: deposits || [], total_approved: totalApproved });
}
