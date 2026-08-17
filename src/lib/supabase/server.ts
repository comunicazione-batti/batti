import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Client Supabase lato server, legato ai cookie della richiesta.
 * Usato per verificare la sessione dell'amministratore (login/logout,
 * middleware, API route protette). Non ha permessi diretti sulle
 * tabelle dati: quelli passano dal client "admin" con service role.
 */
export function createServerSupabaseClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // In alcuni contesti (Server Component puro) i cookie non
            // possono essere scritti: il middleware si occupa comunque
            // di rinnovare la sessione.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // vedi nota sopra
          }
        }
      }
    }
  );
}

/** Verifica se la richiesta corrente ha una sessione admin valida. */
export async function getAdminSession() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("admin_profiles")
    .select("id, email, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return null;
  return { user, profile };
}
