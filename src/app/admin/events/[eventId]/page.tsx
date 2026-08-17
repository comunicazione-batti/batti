import { notFound } from "next/navigation";
import { TopBar } from "@/components/TopBar";
import { EventWorkspace } from "@/components/EventWorkspace";
import { getAdminSession } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { EventRecord, GuestRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminEventPage({ params }: { params: { eventId: string } }) {
  await getAdminSession();

  const db = createAdminSupabaseClient();
  const [{ data: event }, { data: guests }] = await Promise.all([
    db.from("events").select("*").eq("id", params.eventId).maybeSingle(),
    db.from("guests").select("*").eq("event_id", params.eventId).order("expected_arrival", { ascending: true })
  ]);

  if (!event) notFound();

  return (
    <>
      <TopBar title={event.name} backHref="/" />
      <EventWorkspace initialEvent={event as EventRecord} initialGuests={(guests || []) as GuestRecord[]} />
    </>
  );
}
