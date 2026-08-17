"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SplitFlap } from "@/components/SplitFlap";
import { toast } from "@/components/Toast";
import { slotLabel } from "@/lib/time";
import type { EventRecord, GuestRecord, ImportRowResult } from "@/lib/types";

type Tab = "panoramica" | "invitati" | "excel" | "impostazioni";

export function EventWorkspace({ initialEvent, initialGuests }: { initialEvent: EventRecord; initialGuests: GuestRecord[] }) {
  const [tab, setTab] = useState<Tab>("panoramica");
  const [event, setEvent] = useState(initialEvent);
  const [guests, setGuests] = useState(initialGuests);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/events/${initialEvent.id}`, { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    setEvent(data.event);
    setGuests(data.guests);
  }, [initialEvent.id]);

  useEffect(() => {
    const t = setInterval(refresh, 4000);
    return () => clearInterval(t);
  }, [refresh]);

  const total = guests.length;
  const registered = guests.filter((g) => g.registration_status === "registered").length;
  const arrived = guests.filter((g) => g.checked_in).length;
  const notArrived = total - arrived;
  const pct = total ? Math.round((arrived / total) * 100) : 0;

  return (
    <div className="shell" style={{ paddingTop: 20, paddingBottom: 70 }}>
      <Link href="/admin/events" className="backlink">
        &larr; Tutti gli eventi
      </Link>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
        <div>
          <span className="eyebrow">{event.status === "closed" ? "Evento chiuso" : "Evento attivo"}</span>
          <h2 style={{ margin: "8px 0 2px", fontWeight: 500 }}>{event.name}</h2>
          <div style={{ color: "var(--ink-soft)", fontSize: 13.5 }}>{event.date || ""}</div>
        </div>
        <span className={`pill ${event.status === "closed" ? "pill-gray" : "pill-sage"}`}>
          {event.status === "closed" ? "Chiuso" : "Attivo"}
        </span>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === "panoramica" ? "active" : ""}`} onClick={() => setTab("panoramica")}>
          Panoramica
        </button>
        <button className={`tab ${tab === "invitati" ? "active" : ""}`} onClick={() => setTab("invitati")}>
          Invitati ({total})
        </button>
        <button className={`tab ${tab === "excel" ? "active" : ""}`} onClick={() => setTab("excel")}>
          Importa Excel
        </button>
        <button className={`tab ${tab === "impostazioni" ? "active" : ""}`} onClick={() => setTab("impostazioni")}>
          Impostazioni
        </button>
      </div>

      {tab === "panoramica" && (
        <OverviewTab event={event} guests={guests} total={total} registered={registered} arrived={arrived} notArrived={notArrived} pct={pct} />
      )}
      {tab === "invitati" && <GuestsTab event={event} guests={guests} />}
      {tab === "excel" && <ImportTab event={event} onImported={refresh} />}
      {tab === "impostazioni" && <SettingsTab event={event} onUpdated={refresh} />}
    </div>
  );
}

function OverviewTab({
  event,
  guests,
  total,
  registered,
  arrived,
  notArrived,
  pct
}: {
  event: EventRecord;
  guests: GuestRecord[];
  total: number;
  registered: number;
  arrived: number;
  notArrived: number;
  pct: number;
}) {
  const slots: Record<string, { total: number; arrived: number }> = {};
  guests.forEach((g) => {
    const label = slotLabel(g.expected_arrival, event.slot_minutes);
    if (!slots[label]) slots[label] = { total: 0, arrived: 0 };
    slots[label].total++;
    if (g.checked_in) slots[label].arrived++;
  });
  const slotKeys = Object.keys(slots).sort();

  return (
    <>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="l">Totale invitati</div>
          <SplitFlap text={String(total).padStart(3, "0")} />
        </div>
        <div className="stat-card">
          <div className="l">Registrati</div>
          <SplitFlap text={String(registered).padStart(3, "0")} />
        </div>
        <div className="stat-card">
          <div className="l">Arrivati</div>
          <SplitFlap text={String(arrived).padStart(3, "0")} />
        </div>
        <div className="stat-card">
          <div className="l">Da arrivare</div>
          <SplitFlap text={String(notArrived).padStart(3, "0")} />
        </div>
        <div className="stat-card">
          <div className="l">Check-in</div>
          <SplitFlap text={`${String(pct).padStart(2, "0")}%`} />
        </div>
      </div>
      <h3 style={{ fontSize: 15, fontWeight: 600, margin: "26px 0 4px" }}>Arrivi previsti per fascia oraria</h3>
      <div className="slot-list">
        {slotKeys.length === 0 ? (
          <p style={{ color: "var(--ink-soft)", fontSize: 13.5 }}>Nessun invitato ancora caricato.</p>
        ) : (
          slotKeys.map((k) => {
            const s = slots[k];
            const w = s.total ? Math.round((s.arrived / s.total) * 100) : 0;
            return (
              <div className="slot-row" key={k}>
                <div className="top">
                  <span className="t">{k}</span>
                  <span className="n">
                    {s.arrived} / {s.total} arrivati
                  </span>
                </div>
                <div className="bar">
                  <div style={{ width: `${w}%` }} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}

function guestStateLabel(g: GuestRecord) {
  if (g.checked_in) return { t: "Arrivato", cls: "pill-sage" };
  if (g.registration_status === "registered") return { t: "Registrato", cls: "pill-amber" };
  return { t: "Non registrato", cls: "pill-gray" };
}

function GuestsTab({ event, guests }: { event: EventRecord; guests: GuestRecord[] }) {
  const [q, setQ] = useState("");
  const [slot, setSlot] = useState("");
  const [reg, setReg] = useState("");
  const [arr, setArr] = useState("");

  const slotOptions = Array.from(new Set(guests.map((g) => slotLabel(g.expected_arrival, event.slot_minutes)))).sort();

  const filtered = guests
    .filter((g) => {
      if (q) {
        const s = q.toLowerCase();
        if (!(g.first_name.toLowerCase().includes(s) || g.last_name.toLowerCase().includes(s))) return false;
      }
      if (slot && slotLabel(g.expected_arrival, event.slot_minutes) !== slot) return false;
      if (reg === "registered" && g.registration_status !== "registered") return false;
      if (reg === "not" && g.registration_status === "registered") return false;
      if (arr === "yes" && !g.checked_in) return false;
      if (arr === "no" && g.checked_in) return false;
      return true;
    })
    .sort((a, b) => (a.expected_arrival || "").localeCompare(b.expected_arrival || ""));

  return (
    <>
      <div className="filter-row">
        <input type="text" placeholder="Cerca nome o cognome..." value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={slot} onChange={(e) => setSlot(e.target.value)}>
          <option value="">Tutte le fasce</option>
          {slotOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select value={reg} onChange={(e) => setReg(e.target.value)}>
          <option value="">Registrazione: tutte</option>
          <option value="registered">Registrati</option>
          <option value="not">Non registrati</option>
        </select>
        <select value={arr} onChange={(e) => setArr(e.target.value)}>
          <option value="">Arrivo: tutti</option>
          <option value="yes">Arrivati</option>
          <option value="no">Non arrivati</option>
        </select>
        <a className="btn btn-ghost btn-sm" href={`/api/events/${event.id}/guests/export`}>
          Esporta Excel
        </a>
      </div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Cognome</th>
              <th>Orario previsto</th>
              <th>Fascia</th>
              <th>Registrazione</th>
              <th>Check-in</th>
              <th>Orario effettivo</th>
              <th>Stato</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", color: "#8a8375", padding: 26 }}>
                  Nessun invitato corrisponde ai filtri.
                </td>
              </tr>
            ) : (
              filtered.map((g) => {
                const st = guestStateLabel(g);
                return (
                  <tr key={g.id}>
                    <td>{g.first_name}</td>
                    <td>{g.last_name}</td>
                    <td className="mono">{g.expected_arrival || "—"}</td>
                    <td className="mono">{slotLabel(g.expected_arrival, event.slot_minutes)}</td>
                    <td>{g.registration_status === "registered" ? "Sì" : "No"}</td>
                    <td>{g.checked_in ? "Sì" : "No"}</td>
                    <td className="mono">{g.check_in_time || "—"}</td>
                    <td>
                      <span className={`pill ${st.cls}`}>{st.t}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function ImportTab({ event, onImported }: { event: EventRecord; onImported: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ImportRowResult[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoadError(null);
    setRows(null);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`/api/events/${event.id}/guests/import`, { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) {
      setLoadError(data.error || "Errore durante la lettura del file.");
      return;
    }
    setRows(data.rows);
  }

  const validRows = (rows || []).filter((r) => r.errors.length === 0 && !r.isDuplicate);
  const dupRows = (rows || []).filter((r) => r.errors.length === 0 && r.isDuplicate);
  const errorRows = (rows || []).filter((r) => r.errors.length > 0);

  async function confirmImport() {
    setImporting(true);
    try {
      const res = await fetch(`/api/events/${event.id}/guests/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: validRows.map((r) => ({ firstName: r.firstName, lastName: r.lastName, time: r.time })) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore durante l'importazione.");
      toast(`${data.imported} invitati importati.`);
      setRows(null);
      if (fileRef.current) fileRef.current.value = "";
      onImported();
    } catch (e: any) {
      setLoadError(e.message);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="card" style={{ marginTop: 14 }}>
      <span className="eyebrow">Importa lista invitati</span>
      <h3 style={{ margin: "8px 0 6px", fontWeight: 500 }}>Carica file Excel</h3>
      <p style={{ color: "var(--ink-soft)", fontSize: 13.5, margin: "0 0 16px" }}>
        Il file deve contenere le colonne <strong>Nome</strong>, <strong>Cognome</strong> e <strong>Orario</strong> (formato HH:MM).
      </p>
      <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFile} />
      {loadError && <p className="err">{loadError}</p>}
      {rows && (
        <div style={{ marginTop: 18 }}>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 14 }}>
            <span className="pill pill-sage">{validRows.length} pronte</span>
            <span className="pill pill-amber">{dupRows.length} duplicate</span>
            <span className="pill pill-wine">{errorRows.length} con errori</span>
          </div>
          <div className="tbl-wrap" style={{ maxHeight: 340, overflowY: "auto" }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Riga</th>
                  <th>Nome</th>
                  <th>Cognome</th>
                  <th>Orario</th>
                  <th>Esito</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.rowNum}>
                    <td>{r.rowNum}</td>
                    <td>{r.firstName || "—"}</td>
                    <td>{r.lastName || "—"}</td>
                    <td className="mono">{r.time || "—"}</td>
                    <td>
                      {r.errors.length ? (
                        <span className="pill pill-wine">{r.errors.join(", ")}</span>
                      ) : r.isDuplicate ? (
                        <span className="pill pill-amber">Duplicato</span>
                      ) : (
                        <span className="pill pill-sage">OK</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="btn btn-primary" style={{ marginTop: 16 }} disabled={validRows.length === 0 || importing} onClick={confirmImport}>
            {importing ? "Importazione in corso..." : `Conferma importazione (${validRows.length})`}
          </button>
        </div>
      )}
    </div>
  );
}

function SettingsTab({ event, onUpdated }: { event: EventRecord; onUpdated: () => void }) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const guestLink = `${origin}/e/${event.id}`;
  const checkinLink = `${origin}/checkin/${event.id}`;

  async function setStatus(status: "active" | "closed") {
    const res = await fetch(`/api/events/${event.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      toast(status === "closed" ? "Evento chiuso." : "Evento riattivato.");
      onUpdated();
    }
  }

  async function resetData() {
    if (!confirm("Eliminare tutti gli invitati e gli arrivi di questo evento? Questa azione non può essere annullata.")) return;
    const res = await fetch(`/api/events/${event.id}/guests`, { method: "DELETE" });
    if (res.ok) {
      toast("Dati evento azzerati.");
      onUpdated();
    }
  }

  return (
    <div className="card" style={{ marginTop: 14, maxWidth: 560 }}>
      <span className="eyebrow">Impostazioni evento</span>
      <h3 style={{ margin: "8px 0 18px", fontWeight: 500 }}>Stato e link</h3>
      <div className="field">
        <label>Link pubblico invitati</label>
        <input type="text" readOnly value={guestLink} className="mono" style={{ fontSize: 12.5 }} />
      </div>
      <div className="field">
        <label>Link area check-in</label>
        <input type="text" readOnly value={checkinLink} className="mono" style={{ fontSize: 12.5 }} />
      </div>
      <div className="field">
        <label>Stato evento</label>
        <div style={{ display: "flex", gap: 8 }}>
          <button className={`btn btn-sm ${event.status !== "closed" ? "btn-primary" : "btn-ghost"}`} onClick={() => setStatus("active")}>
            Attivo
          </button>
          <button className={`btn btn-sm ${event.status === "closed" ? "btn-primary" : "btn-ghost"}`} onClick={() => setStatus("closed")}>
            Chiuso
          </button>
        </div>
        <div className="hint">Quando l&apos;evento è chiuso, i QR non possono più essere utilizzati per il check-in.</div>
      </div>
      <hr style={{ border: "none", borderTop: "1px solid var(--line)", margin: "18px 0" }} />
      <button className="btn btn-danger btn-sm" onClick={resetData}>
        Azzera i dati di questo evento
      </button>
    </div>
  );
}
