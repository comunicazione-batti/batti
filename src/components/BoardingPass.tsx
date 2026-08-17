"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import Image from "next/image";
import { SplitFlap } from "@/components/SplitFlap";
import { slotLabel } from "@/lib/time";
import type { GuestPublic } from "@/lib/types";

export function BoardingPass({
  eventName,
  eventDate,
  slotMinutes,
  guest
}: {
  eventName: string;
  eventDate: string | null;
  slotMinutes: number;
  guest: GuestPublic;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, guest.qrToken, {
        width: 220,
        margin: 1,
        color: { dark: "#1B1918", light: "#F6F1E7" }
      });
    }
  }, [guest.qrToken]);

  return (
    <div className="pass">
      <div className="pass-top">
        <Image src="/logo-icon-white.png" alt="BattiBecco" width={130} height={26} className="pass-logo" style={{ height: 26, width: "auto" }} />
        <span className="eyebrow">Registrazione completata</span>
        <h2>
          {guest.firstName} {guest.lastName}
        </h2>
        <div className="sub">
          {eventName}
          {eventDate ? ` · ${eventDate}` : ""}
        </div>
      </div>
      <div className="pass-divider" />
      <div className="pass-mid">
        <div className="pass-time-block">
          <div className="lbl">Arrivo previsto</div>
          <SplitFlap text={guest.expectedArrival || "--:--"} />
        </div>
        <div className="pass-time-block" style={{ textAlign: "right" }}>
          <div className="lbl">Fascia</div>
          <div className="mono" style={{ fontSize: 15 }}>
            {slotLabel(guest.expectedArrival, slotMinutes)}
          </div>
        </div>
      </div>
      <div className="pass-divider" />
      <div className="pass-qr">
        <div className="lbl" style={{ marginBottom: 10, color: "#B9B2A4", fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase" }}>
          Il tuo QR code
        </div>
        <div className="qrbox">
          <canvas ref={canvasRef} />
        </div>
        <div className="qr-note">Mostra questo codice allo staff del parcheggio all&apos;arrivo. Puoi tornare su questa pagina in qualsiasi momento.</div>
      </div>
    </div>
  );
}
