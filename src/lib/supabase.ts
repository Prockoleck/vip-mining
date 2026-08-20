import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key || url === "your_supabase_url_here") {
      throw new Error(
        "Supabase credentials not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
      );
    }
    _client = createClient(url, key);
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
