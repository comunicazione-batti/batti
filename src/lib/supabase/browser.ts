import { createBrowserClient } from "@supabase/ssr";

/**
 * Client Supabase per il browser. Usa la chiave anonima, che non ha
 * alcun permesso sulle tabelle (RLS le blocca): serve esclusivamente
 * per il login/logout dell'amministratore tramite Supabase Auth.
 * Tutti i dati (eventi, invitati, check-in) passano dalle API route.
 */
export function createBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
