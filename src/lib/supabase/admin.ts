import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase con service role key: bypassa la Row Level Security
 * ed è l'unico modo in cui questa applicazione legge/scrive eventi e
 * invitati. Va importato SOLO da codice che gira sul server (API
 * route, route handler) e mai da un componente client o da codice
 * che finisce nel bundle del browser.
 */
export function createAdminSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false }
    }
  );
}
