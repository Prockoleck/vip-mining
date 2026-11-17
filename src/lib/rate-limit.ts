import { supabase } from "@/lib/supabase";

// In-memory counters do not work on serverless: each request may land on a
// different instance, so every instance would allow the full quota again.
// Attempts are therefore recorded in Postgres, which all instances share.

export async function rateLimit(key: string, max: number, windowMs: number) {
  const since = new Date(Date.now() - windowMs).toISOString();

  const { data, count } = await supabase
    .from("rate_limits")
    .select("created_at", { count: "exact" })
    .eq("key", key)
    .gte("created_at", since)
    .order("created_at", { ascending: true })
    .limit(1);

  if ((count ?? 0) >= max) {
    const oldest = data?.[0]?.created_at
      ? new Date(data[0].created_at).getTime()
      : Date.now();
    return {
      allowed: false,
      retryAfterMs: Math.max(0, windowMs - (Date.now() - oldest)),
    };
  }

  await supabase.from("rate_limits").insert({ key });

  // Cheap probabilistic purge so the table does not grow forever.
  if (Math.random() < 0.02) {
    const cutoff = new Date(Date.now() - windowMs * 4).toISOString();
    await supabase.from("rate_limits").delete().lt("created_at", cutoff);
  }

  return { allowed: true, retryAfterMs: 0 };
}

export async function resetRateLimit(key: string) {
  await supabase.from("rate_limits").delete().eq("key", key);
}

export function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}
