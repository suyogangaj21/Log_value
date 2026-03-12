// lib/supabase/public.ts
// A Supabase client for reading public (anonymous SELECT) data in server components.
// Does NOT call cookies() — safe to use inside unstable_cache() and generateMetadata.
import { createClient } from "@supabase/supabase-js";

export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
