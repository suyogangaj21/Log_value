// lib/supabase/service.ts
// Service-role Supabase client — BYPASSES RLS.
// Only use in trusted server-side contexts (worker routes, seed).
// Never import from client components or expose to the browser.
import { createClient } from "@supabase/supabase-js";

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  if (!key)
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set — add it to .env");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
