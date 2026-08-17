"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import type { ScanResponse } from "@/lib/types";

interface PublicEvent {
  id: string;
  name: string;
  date: string | null;
  status: "active" | "closed";
}

export function Scanner({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [scanning, setScanning] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [manualOpen, setManualOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    fetch(`/api/events/${eventId}/public`)
      .then((r) => r.json())
      .then((d) => setEvent(d.event))
      .catch(() => {});
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  function stopCamera() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  }

  async function startScanning() {
    setCamError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setScanning(true);

      if (!canvasRef.current) canvasRef.current = document.createElement("canvas");
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

      const tick = () => {
        const video = videoRef.current;
        if (!video || !streamRef.current) return;
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imgData.data, imgData.width, imgData.height, { inversionAttempts: "dontInvert" });
          if (code && code.data && !busyRef.current) {
            handleScan(code.data);
            return;
          }
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setCamError("Fotocamera non disponibile in questo browser/dispositivo. Usa l'inserimento manuale qui sotto per continuare.");
    }
  }

  function feedback(kind: "ok" | "used" | "bad") {
    try {
      if (navigator.vibrate) navigator.vibrate(kind === "ok" ? 90 : [60, 60, 60]);
    } catch {}
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.frequency.value = kind === "ok" ? 880 : kind === "used" ? 440 : 220;
      g.gain.setValueAtTime(0.06, ctx.currentTime);
      o.start();
      o.stop(ctx.currentTime + 0.14);
    } catch {}
  }

  async function handleScan(token: string) {
    busyRef.current = true;
    stopCamera();
    try {
      const res = await fetch(`/api/events/${eventId}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      });
      const data: ScanResponse = await res.json();
      feedback(data.kind);
      setResult(data);
    } finally {
      busyRef.current = false;
    }
  }

  function dismissResult() {
    setResult(null);
  }

  if (!event) {
    return <div style={{ padding: 60, textAlign: "center", color: "var(--ink-soft)" }}>Caricamento...</div>;
  }

  return (
    <div className="scan-shell">
      <div className="shell" style={{ paddingTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: "0 0 4px", fontWeight: 500, fontSize: 22 }}>{event.name}</h2>
          <span className="pill pill-sage">Postazione check-in</span>
        </div>
        {event.status === "closed" && (
          <p className="err" style={{ marginTop: 8 }}>
            Questo evento è chiuso: i QR non vengono più accettati.
          </p>
        )}
      </div>

      <div className="scan-cam">
        {!scanning && (
          <div style={{ color: "#fff", textAlign: "center", padding: 20, fontSize: 14 }}>
            {camError || 'Premi "Scansiona QR" per attivare la fotocamera.'}
          </div>
        )}
        <video ref={videoRef} playsInline muted style={{ display: scanning ? "block" : "none" }} />
        {scanning && (
          <div className="scan-frame">
            <div className="box" />
          </div>
        )}
      </div>

      <div className="shell" style={{ padding: "20px 20px 40px", textAlign: "center" }}>
        <button
          className="btn btn-primary"
          style={{ fontSize: 16, padding: "16px 28px", borderRadius: 12 }}
          onClick={startScanning}
          disabled={scanning}
        >
          Scansiona QR code
        </button>
        <div style={{ marginTop: 12 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setManualOpen(true)}>
            Inserisci token manualmente (test senza fotocamera)
          </button>
        </div>
      </div>

      {manualOpen && <ManualCheckin eventId={eventId} onClose={() => setManualOpen(false)} onResult={(r) => { setManualOpen(false); feedback(r.kind); setResult(r); }} />}

      {result && (
        <div className={`scan-result ${result.kind}`}>
          <div className="icon">{result.kind === "ok" ? "✓" : result.kind === "used" ? "⚠" : "✕"}</div>
          <h2>{result.title}</h2>
          {result.name && <div className="name">{result.name}</div>}
          {result.sub && <div style={{ opacity: 0.9, fontSize: 14.5, maxWidth: 320 }}>{result.sub}</div>}
          {result.kind === "ok" && (
            <div className="times">
              <div>
                <div className="l">Previsto</div>
                <div className="v">{result.expected || "—"}</div>
              </div>
              <div>
                <div className="l">Effettivo</div>
                <div className="v">{result.actual || "—"}</div>
              </div>
            </div>
          )}
          <button
            className="btn"
            style={{ marginTop: 34, background: "rgba(255,255,255,0.15)", borderColor: "rgba(255,255,255,0.5)", color: "#fff", padding: "12px 24px" }}
            onClick={dismissResult}
          >
            Scansiona il prossimo
          </button>
        </div>
      )}
    </div>
  );
}

function ManualCheckin({ eventId, onClose, onResult }: { eventId: string; onClose: () => void; onResult: (r: ScanResponse) => void }) {
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    if (!token.trim()) {
      setError("Incolla il token del QR da testare.");
      return;
    }
    const res = await fetch(`/api/events/${eventId}/checkin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: token.trim() })
    });
    const data = await res.json();
    onResult(data);
  }

  return (
    <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <button className="modal-close" onClick={onClose}>
          &times;
        </button>
        <span className="eyebrow">Solo per test</span>
        <h3 style={{ margin: "8px 0 14px" }}>Check-in manuale</h3>
        <p style={{ color: "var(--ink-soft)", fontSize: 13, margin: "0 0 14px" }}>
          Incolla qui il token del QR di un invitato (visibile, ad esempio, nella colonna dedicata dell&apos;esportazione Excel o copiandolo dal link del boarding pass) per simulare una scansione senza fotocamera.
        </p>
        <div className="field">
          <label>Token QR</label>
          <input type="text" value={token} onChange={(e) => setToken(e.target.value)} placeholder="es. 3f9a2b1c..." className="mono" />
          {error && <div className="err">{error}</div>}
        </div>
        <button className="btn btn-primary btn-block" onClick={confirm}>
          Simula scansione
        </button>
      </div>
    </div>
  );
}
