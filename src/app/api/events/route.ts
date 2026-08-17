import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorizzato." }, { status: 401 });

  const db = createAdminSupabaseClient();
  const { data, error } = await db.from("events").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ events: data });
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorizzato." }, { status: 401 });

  const body = await req.json();
  const name = (body.name || "").trim();
  const date = body.date || null;
  const description = (body.description || "").trim() || null;
  const slotMinutes = Number(body.slotMinutes) || 30;

  if (!name) return NextResponse.json({ error: "Il nome dell'evento è obbligatorio." }, { status: 400 });

  const db = createAdminSupabaseClient();
  const { data, error } = await db
    .from("events")
    .insert({ name, date, description, slot_minutes: slotMinutes, status: "active" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ event: data });
}
