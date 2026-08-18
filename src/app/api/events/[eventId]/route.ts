import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function GET(_req: Request, { params }: { params: { eventId: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorizzato." }, { status: 401 });

  const db = createAdminSupabaseClient();
  const [{ data: event, error: evErr }, { data: guests, error: gErr }] = await Promise.all([
    db.from("events").select("*").eq("id", params.eventId).maybeSingle(),
    db.from("guests").select("*").eq("event_id", params.eventId).order("expected_arrival", { ascending: true })
  ]);

  if (evErr) return NextResponse.json({ error: evErr.message }, { status: 500 });
  if (!event) return NextResponse.json({ error: "Evento non trovato." }, { status: 404 });
  if (gErr) return NextResponse.json({ error: gErr.message }, { status: 500 });

  return NextResponse.json({ event, guests });
}

export async function PATCH(req: Request, { params }: { params: { eventId: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorizzato." }, { status: 401 });

  const body = await req.json();
  const updates: Record<string, unknown> = {};
  if (body.status && ["active", "closed"].includes(body.status)) updates.status = body.status;
  if (body.slotMinutes) updates.slot_minutes = Number(body.slotMinutes);
  if (typeof body.name === "string" && body.name.trim()) updates.name = body.name.trim();

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nessun campo da aggiornare." }, { status: 400 });
  }

  const db = createAdminSupabaseClient();
  const { data, error } = await db.from("events").update(updates).eq("id", params.eventId).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ event: data });
}

/**
 * Elimina definitivamente l'evento. Grazie a "on delete cascade" nello
 * schema, vengono eliminati automaticamente anche tutti gli invitati e
 * lo storico dei check-in collegati.
 */
export async function DELETE(_req: Request, { params }: { params: { eventId: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorizzato." }, { status: 401 });

  const db = createAdminSupabaseClient();
  const { error } = await db.from("events").delete().eq("id", params.eventId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
