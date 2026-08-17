import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function GET(_req: Request, { params }: { params: { eventId: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorizzato." }, { status: 401 });

  const db = createAdminSupabaseClient();
  const { data, error } = await db
    .from("guests")
    .select("*")
    .eq("event_id", params.eventId)
    .order("expected_arrival", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ guests: data });
}

/** Azzera tutti gli invitati e gli arrivi di un evento (solo demo/test). */
export async function DELETE(_req: Request, { params }: { params: { eventId: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorizzato." }, { status: 401 });

  const db = createAdminSupabaseClient();
  const { error } = await db.from("guests").delete().eq("event_id", params.eventId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
