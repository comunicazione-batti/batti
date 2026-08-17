import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { checkRateLimit, clientKeyFromRequest } from "@/lib/rateLimit";
import { nowTimeStr } from "@/lib/time";
import type { ScanResponse } from "@/lib/types";

export async function POST(req: Request, { params }: { params: { eventId: string } }) {
  const key = `checkin:${clientKeyFromRequest(req)}`;
  if (!checkRateLimit(key, 120, 60_000)) {
    return NextResponse.json({ error: "Troppe richieste. Rallenta un attimo." }, { status: 429 });
  }

  const body = await req.json();
  const token = String(body.token || "").trim();
  if (!token) return NextResponse.json({ error: "Token mancante." }, { status: 400 });

  const db = createAdminSupabaseClient();

  const { data: event } = await db.from("events").select("*").eq("id", params.eventId).maybeSingle();
  if (!event) return NextResponse.json({ error: "Evento non trovato." }, { status: 404 });

  const { data: guest } = await db.from("guests").select("*").eq("qr_token", token).maybeSingle();

  let response: ScanResponse;

  if (!guest || guest.event_id !== params.eventId) {
    response = { kind: "bad", title: "QR code non valido", sub: "Codice non riconosciuto per questo evento." };
  } else if (event.status === "closed") {
    response = {
      kind: "bad",
      title: "Evento chiuso",
      sub: "Non è più possibile registrare arrivi.",
      name: `${guest.first_name} ${guest.last_name}`
    };
  } else if (guest.checked_in) {
    response = {
      kind: "used",
      title: "QR code già utilizzato",
      name: `${guest.first_name} ${guest.last_name}`,
      sub: `Check-in effettuato alle ${guest.check_in_time}.`
    };
  } else {
    const t = nowTimeStr();
    const { error } = await db
      .from("guests")
      .update({
        checked_in: true,
        check_in_time: t,
        check_in_timestamp: new Date().toISOString(),
        registration_status: "registered"
      })
      .eq("id", guest.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await db.from("check_ins").insert({ guest_id: guest.id, event_id: params.eventId });

    response = {
      kind: "ok",
      title: "Arrivo confermato",
      name: `${guest.first_name} ${guest.last_name}`,
      expected: guest.expected_arrival,
      actual: t
    };
  }

  return NextResponse.json(response);
}
