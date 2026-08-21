import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { amount } = await request.json();
  if (!amount || amount < 10) {
    return NextResponse.json({ error: "Minimum deposit is 10 USDT." }, { status: 400 });
  }

  const { error } = await supabase
    .from("deposits")
    .insert({ user_id: user.id, amount, status: "pending", created_at: new Date().toISOString() });

  if (error) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
