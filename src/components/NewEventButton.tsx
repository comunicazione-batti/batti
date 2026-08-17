"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/Toast";

export function NewEventButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [slotMinutes, setSlotMinutes] = useState("30");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!name.trim()) {
      setError("Inserisci un nome.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, date, description, slotMinutes: Number(slotMinutes) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore durante la creazione.");
      setOpen(false);
      toast("Evento creato.");
      router.push(`/admin/events/${data.event.id}`);
    } catch (e: any) {
      setError(e.message || "Non è stato possibile salvare l'evento.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button className="btn btn-brass" onClick={() => setOpen(true)}>
        + Nuovo evento
      </button>
      {open && (
        <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="modal">
            <button className="modal-close" onClick={() => setOpen(false)}>
              &times;
            </button>
            <span className="eyebrow">Nuovo evento</span>
            <h3 style={{ margin: "8px 0 18px" }}>Crea evento</h3>
            <div className="field">
              <label>Nome evento</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Matrimonio Mario & Giulia" />
            </div>
            <div className="field">
              <label>Data</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="field">
              <label>Descrizione (opzionale)</label>
              <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="field">
              <label>Ampiezza fasce orarie (minuti)</label>
              <select value={slotMinutes} onChange={(e) => setSlotMinutes(e.target.value)}>
                <option value="15">15 minuti</option>
                <option value="30">30 minuti</option>
                <option value="60">60 minuti</option>
              </select>
            </div>
            {error && <div className="err" style={{ marginBottom: 12 }}>{error}</div>}
            <button className="btn btn-primary btn-block" onClick={submit} disabled={saving}>
              {saving ? "Creazione in corso..." : "Crea evento"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
