import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Supabase free projects pause after 7 days without activity. A daily cron hit
// keeps the project warm so the site never comes back to a paused database.
export async function GET() {
  const started = Date.now();
  const { error } = await supabase.from("users").select("id").limit(1);

  return NextResponse.json(
    {
      ok: !error,
      latency_ms: Date.now() - started,
      checked_at: new Date().toISOString(),
      error: error?.message,
    },
    { status: error ? 503 : 200 }
  );
}
