"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/Toast";
import type { EventRecord } from "@/lib/types";

export function EventsList({ events }: { events: EventRecord[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function confirmDelete(ev: EventRecord) {
    const typed = window.prompt(
      `Per eliminare definitivamente "${ev.name}" (invitati e check-in inclusi), scrivi il nome esatto dell'evento:`
    );
    if (typed === null) return;
    if (typed.trim() !== ev.name) {
      toast("Nome non corrispondente: evento non eliminato.");
      return;
    }
    setDeletingId(ev.id);
    try {
      const res = await fetch(`/api/events/${ev.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast(data.error || "Non è stato possibile eliminare l'evento.");
        return;
      }
      toast("Evento eliminato.");
      router.refresh();
    } finally {
      setDeletingId(null);
      setPendingId(null);
    }
  }

  return (
    <div>
      {events.map((ev) => (
        <div key={ev.id} className="event-row" style={{ cursor: "default" }}>
          <a
            href={`/admin/events/${ev.id}`}
            className="info"
            style={{ textDecoration: "none", color: "inherit", flex: 1, cursor: "pointer" }}
          >
            <h4>{ev.name}</h4>
            <div className="d">
              {ev.date || ""}
              {ev.description ? ` · ${ev.description}` : ""}
            </div>
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className={`pill ${ev.status === "closed" ? "pill-gray" : "pill-sage"}`}>
              {ev.status === "closed" ? "Chiuso" : "Attivo"}
            </span>
            <button
              className="btn btn-ghost btn-sm"
              style={{ color: "var(--wine)", borderColor: "var(--wine-bg)" }}
              disabled={deletingId === ev.id}
              onClick={(e) => {
                e.preventDefault();
                confirmDelete(ev);
              }}
            >
              {deletingId === ev.id ? "..." : "Elimina"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
