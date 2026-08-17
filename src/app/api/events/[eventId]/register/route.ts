import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { checkRateLimit, clientKeyFromRequest } from "@/lib/rateLimit";
import type { GuestPublic } from "@/lib/types";

function escapeLike(s: string): string {
  return s.replace(/[%_\\]/g, (c) => `\\${c}`);
}

function toPublic(g: any): GuestPublic {
  return {
    id: g.id,
    firstName: g.first_name,
    lastName: g.last_name,
    expectedArrival: g.expected_arrival,
    registrationStatus: g.registration_status,
    qrToken: g.qr_token
  };
}

export async function POST(req: Request, { params }: { params: { eventId: string } }) {
  const key = `register:${clientKeyFromRequest(req)}`;
  if (!checkRateLimit(key, 20, 60_000)) {
    return NextResponse.json({ error: "Troppi tentativi. Riprova tra qualche minuto." }, { status: 429 });
  }

  const db = createAdminSupabaseClient();
  const { data: event } = await db.from("events").select("id, status").eq("id", params.eventId).maybeSingle();
  if (!event) return NextResponse.json({ error: "Evento non trovato." }, { status: 404 });

  const body = await req.json();
  const guestId: string | undefined = body.guestId;

  // Caso 1: l'invitato ha già scelto tra più omonimi (o sta recuperando il proprio QR con l'id salvato sul dispositivo).
  if (guestId) {
    const { data: guest, error } = await db.from("guests").select("*").eq("id", guestId).eq("event_id", params.eventId).maybeSingle();
    if (error || !guest) return NextResponse.json({ error: "Invitato non trovato." }, { status: 404 });

    if (guest.registration_status !== "registered") {
      await db.from("guests").update({ registration_status: "registered" }).eq("id", guest.id);
      guest.registration_status = "registered";
    }
    return NextResponse.json({ status: "registered", guest: toPublic(guest) });
  }

  // Caso 2: ricerca per nome e cognome.
  const firstName = String(body.firstName || "").trim();
  const lastName = String(body.lastName || "").trim();
  if (!firstName || !lastName) {
    return NextResponse.json({ error: "Inserisci nome e cognome." }, { status: 400 });
  }

  const { data: matches, error } = await db
    .from("guests")
    .select("*")
    .eq("event_id", params.eventId)
    .ilike("first_name", escapeLike(firstName))
    .ilike("last_name", escapeLike(lastName));

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!matches || matches.length === 0) {
    return NextResponse.json(
      { error: "Nominativo non trovato nella lista invitati. Controlla i dati inseriti o contatta gli organizzatori." },
      { status: 404 }
    );
  }

  if (matches.length > 1) {
    return NextResponse.json({ status: "choose", matches: matches.map(toPublic) });
  }

  const guest = matches[0];
  if (guest.registration_status !== "registered") {
    await db.from("guests").update({ registration_status: "registered" }).eq("id", guest.id);
    guest.registration_status = "registered";
  }
  return NextResponse.json({ status: "registered", guest: toPublic(guest) });
}
