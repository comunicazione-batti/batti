import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function GET(_req: Request, { params }: { params: { eventId: string } }) {
  const db = createAdminSupabaseClient();
  const { data, error } = await db
    .from("events")
    .select("id, name, date, status, slot_minutes")
    .eq("id", params.eventId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Evento non trovato." }, { status: 404 });
  return NextResponse.json({ event: data });
}
