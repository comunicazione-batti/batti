import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function GuestEventPickerPage() {
  const db = createAdminSupabaseClient();
  const { data } = await db.from("events").select("id, name, date").eq("status", "active").order("date", { ascending: true });
  const events = data || [];

  return (
    <>
      <TopBar title="Invitato" backHref="/" />
      <div className="shell-narrow" style={{ paddingTop: 56, paddingBottom: 60 }}>
        <span className="eyebrow">Registrazione ospite</span>
        <h2 style={{ margin: "10px 0 20px", fontWeight: 500 }}>Scegli il tuo evento</h2>
        {events.length === 0 ? (
          <div className="empty card">
            <h3>Nessun evento attivo</h3>
            <p>Chiedi allo staff il link corretto.</p>
          </div>
        ) : (
          events.map((ev) => (
            <Link key={ev.id} href={`/e/${ev.id}`} className="event-row">
              <div className="info">
                <h4>{ev.name}</h4>
                <div className="d">{ev.date || ""}</div>
              </div>
            </Link>
          ))
        )}
        <p className="privacy-note">In un uso reale ogni invitato riceve il link diretto al proprio evento e non passa da questa schermata.</p>
      </div>
    </>
  );
}
