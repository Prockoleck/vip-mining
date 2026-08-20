import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getUser } from "@/lib/auth";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: l1Data } = await supabase.from("users").select("id, total_recharge").eq("referrer_id", user.id);
  const l1Count = l1Data?.length || 0;
  let totalComm = 0;
  const l1Ids: number[] = [];

  l1Data?.forEach((u) => {
    totalComm += Number(u.total_recharge) * 0.05;
    l1Ids.push(u.id);
  });

  let l2Count = 0;
  const l2Ids: number[] = [];
  if (l1Ids.length > 0) {
    const { data: l2Data } = await supabase.from("users").select("id, total_recharge").in("referrer_id", l1Ids);
    l2Data?.forEach((u) => {
      l2Count++;
      totalComm += Number(u.total_recharge) * 0.03;
      l2Ids.push(u.id);
    });
  }

  let l3Count = 0;
  const l3Ids: number[] = [];
  if (l2Ids.length > 0) {
    const { data: l3Data } = await supabase.from("users").select("id, total_recharge").in("referrer_id", l2Ids);
    l3Data?.forEach((u) => {
      l3Count++;
      totalComm += Number(u.total_recharge) * 0.01;
      l3Ids.push(u.id);
    });
  }

  let l4Count = 0;
  if (l3Ids.length > 0) {
    const { data: l4Data } = await supabase.from("users").select("id").in("referrer_id", l3Ids);
    l4Count = l4Data?.length || 0;
    totalComm += l4Count * 0.25;
  }

  const inviteLink = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/?ref=${user.referral_code}`;

  return NextResponse.json({
    total_team: l1Count + l2Count + l3Count + l4Count,
    total_comm: totalComm,
    invite_link: inviteLink,
    lvl1: l1Count,
    lvl2: l2Count,
    lvl3: l3Count,
    lvl4: l4Count,
  });
}
