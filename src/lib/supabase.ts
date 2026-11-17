import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

    // Server-side queries must use the service role key: every table has RLS
    // enabled and the anon key cannot write, which would silently break signup,
    // deposits, mining and withdrawals. The key is only read in server code and
    // is never part of the browser bundle.
    const serverKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const key =
      typeof window === "undefined"
        ? serverKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key || url === "your_supabase_url_here") {
      throw new Error(
        "Supabase credentials not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local"
      );
    }

    if (typeof window === "undefined" && !serverKey) {
      console.warn(
        "[supabase] SUPABASE_SERVICE_ROLE_KEY is missing; falling back to the anon key. " +
          "Writes will be rejected by row level security."
      );
    }

    _client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _client;
}

// Export as an object with a getter so `supabase.from(...)` still works
// and it won't crash at import/build time (only when actually called).
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, _receiver) {
    return Reflect.get(getClient(), prop, getClient());
  },
});
