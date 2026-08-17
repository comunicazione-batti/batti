import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { NewEventButton } from "@/components/NewEventButton";
import { getAdminSession } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { EventRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  await getAdminSession(); // il middleware protegge già la rotta; controllo extra per sicurezza

  const db = createAdminSupabaseClient();
  const { data } = await db.from("events").select("*").order("created_at", { ascending: false });
  const events = (data || []) as EventRecord[];

  return (
    <>
      <TopBar title="Amministratore" backHref="/" />
      <div className="shell" style={{ paddingTop: 28, paddingBottom: 60 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
          <div>
            <span className="eyebrow">I tuoi eventi</span>
            <h2 style={{ margin: "8px 0 0", fontWeight: 500 }}>Eventi</h2>
          </div>
          <NewEventButton />
        </div>

        {events.length === 0 ? (
          <div className="empty card">
            <h3>Nessun evento ancora</h3>
            <p>Crea il primo evento per iniziare a caricare la lista invitati.</p>
          </div>
        ) : (
          <div>
            {events.map((ev) => (
              <Link key={ev.id} href={`/admin/events/${ev.id}`} className="event-row">
                <div className="info">
                  <h4>{ev.name}</h4>
                  <div className="d">
                    {ev.date || ""}
                    {ev.description ? ` · ${ev.description}` : ""}
                  </div>
                </div>
                <span className={`pill ${ev.status === "closed" ? "pill-gray" : "pill-sage"}`}>
                  {ev.status === "closed" ? "Chiuso" : "Attivo"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
