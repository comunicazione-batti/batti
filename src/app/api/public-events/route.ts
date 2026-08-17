import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

/**
 * Elenco pubblico ridotto (solo nome/data) degli eventi attivi.
 * Serve solo come comodità per le pagine /e e /checkin quando non si
 * apre direttamente il link dedicato dell'evento: in un uso reale,
 * invitati e staff ricevono sempre il link diretto /e/[eventId] o
 * /checkin/[eventId] e questa lista non è necessaria.
 */
export async function GET() {
  const db = createAdminSupabaseClient();
  const { data, error } = await db
    .from("events")
    .select("id, name, date")
    .eq("status", "active")
    .order("date", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ events: data });
}
