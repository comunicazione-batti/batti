"use client";

import { useEffect, useState } from "react";
import { BoardingPass } from "@/components/BoardingPass";
import type { GuestPublic } from "@/lib/types";

type Step = "loading" | "form" | "choose" | "pass";

interface PublicEvent {
  id: string;
  name: string;
  date: string | null;
  status: "active" | "closed";
  slot_minutes: number;
}

function storageKey(eventId: string) {
  return `bb-guest-${eventId}`;
}

export function GuestFlow({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [step, setStep] = useState<Step>("loading");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<GuestPublic[]>([]);
  const [guest, setGuest] = useState<GuestPublic | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/events/${eventId}/public`);
      if (!res.ok) {
        setStep("form");
        return;
      }
      const data = await res.json();
      setEvent(data.event);

      const savedId = typeof window !== "undefined" ? window.localStorage.getItem(storageKey(eventId)) : null;
      if (savedId) {
        const r = await fetch(`/api/events/${eventId}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guestId: savedId })
        });
        if (r.ok) {
          const rd = await r.json();
          setGuest(rd.guest);
          setStep("pass");
          return;
        }
        window.localStorage.removeItem(storageKey(eventId));
      }
      setStep("form");
    })();
  }, [eventId]);

  async function submitForm() {
    if (!firstName.trim() || !lastName.trim()) {
      setError("Inserisci nome e cognome.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Nominativo non trovato.");
        return;
      }
      if (data.status === "choose") {
        setMatches(data.matches);
        setStep("choose");
        return;
      }
      completeRegistration(data.guest);
    } finally {
      setSubmitting(false);
    }
  }

  async function chooseGuest(guestId: string) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/events/${eventId}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId })
      });
      const data = await res.json();
      if (res.ok) completeRegistration(data.guest);
    } finally {
      setSubmitting(false);
    }
  }

  function completeRegistration(g: GuestPublic) {
    setGuest(g);
    window.localStorage.setItem(storageKey(eventId), g.id);
    setStep("pass");
  }

  if (step === "loading") {
    return <div className="shell-narrow" style={{ paddingTop: 60, textAlign: "center", color: "var(--ink-soft)" }}>Caricamento...</div>;
  }

  if (step === "pass" && guest && event) {
    return (
      <div className="shell-narrow pass-wrap" style={{ paddingTop: 36, paddingBottom: 60 }}>
        <BoardingPass eventName={event.name} eventDate={event.date} slotMinutes={event.slot_minutes} guest={guest} />
        <button
          className="btn btn-ghost btn-block"
          style={{ marginTop: 18 }}
          onClick={() => {
            window.localStorage.removeItem(storageKey(eventId));
            setGuest(null);
            setFirstName("");
            setLastName("");
            setStep("form");
          }}
        >
          Cerca un altro nominativo
        </button>
        <p className="privacy-note">
          Il codice non contiene dati personali: è un identificativo casuale collegato in modo sicuro al tuo nominativo nel database dell&apos;evento.
        </p>
      </div>
    );
  }

  if (step === "choose") {
    return (
      <div className="shell-narrow" style={{ paddingTop: 50, paddingBottom: 60 }}>
        <button className="backlink" onClick={() => setStep("form")}>
          &larr; Indietro
        </button>
        <span className="eyebrow">Più corrispondenze trovate</span>
        <h2 style={{ margin: "10px 0 8px", fontWeight: 500 }}>Sei tu?</h2>
        <p style={{ color: "var(--ink-soft)", fontSize: 14, margin: "0 0 18px" }}>
          Abbiamo trovato più invitati con lo stesso nome. Seleziona il tuo orario di arrivo previsto.
        </p>
        {matches.map((m) => (
          <div key={m.id} className="homonym-item" onClick={() => !submitting && chooseGuest(m.id)}>
            <strong>
              {m.firstName} {m.lastName}
            </strong>
            <br />
            <span className="mono" style={{ fontSize: 13, color: "var(--ink-soft)" }}>
              Arrivo previsto: {m.expectedArrival || "—"}
            </span>
          </div>
        ))}
        <p className="privacy-note">Se nessuna corrispondenza è corretta, contatta lo staff: potranno risolvere manualmente il caso dall&apos;area amministratore.</p>
      </div>
    );
  }

  return (
    <div className="shell-narrow" style={{ paddingTop: 50, paddingBottom: 60 }}>
      <span className="eyebrow">{event?.name || "Registrazione ospite"}</span>
      <h2 style={{ margin: "10px 0 8px", fontWeight: 500 }}>Benvenuto/a</h2>
      <p style={{ color: "var(--ink-soft)", fontSize: 14.5, margin: "0 0 24px", lineHeight: 1.6 }}>
        Inserisci i tuoi dati per registrarti all&apos;evento e ricevere il tuo QR personale.
      </p>
      <div className="field">
        <label>Nome</label>
        <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Mario" />
      </div>
      <div className="field">
        <label>Cognome</label>
        <input
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Rossi"
          onKeyDown={(e) => e.key === "Enter" && submitForm()}
        />
      </div>
      {error && <div className="err" style={{ marginBottom: 12 }}>{error}</div>}
      <button className="btn btn-primary btn-block" onClick={submitForm} disabled={submitting}>
        {submitting ? "Verifica in corso..." : "Registrati"}
      </button>
      <p className="privacy-note">Utilizzando questo servizio acconsenti al trattamento dei dati necessari alla gestione dell&apos;accesso all&apos;evento.</p>
    </div>
  );
}
