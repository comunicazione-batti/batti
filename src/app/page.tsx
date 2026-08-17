import Link from "next/link";
import Image from "next/image";
import { TopBar } from "@/components/TopBar";

export default function LandingPage() {
  return (
    <>
      <TopBar title="Arrivi" />
      <div className="shell">
        <div className="landing-hero">
          <Image src="/logo-wordmark.png" alt="BattiBecco" width={280} height={30} className="hero-logo" style={{ height: 56, width: "auto" }} />
          <span className="eyebrow">Gestione arrivi invitati</span>
          <h1>Chi arriva, quando arriva.</h1>
          <p>
            Una web app per matrimoni ed eventi privati: registrazione invitati, QR personale e
            check-in al parcheggio, tutto in tempo reale.
          </p>
        </div>

        <div className="role-grid">
          <Link href="/admin" className="role-card">
            <div className="num">01 — Staff</div>
            <h3>Amministratore</h3>
            <p>Crea l&apos;evento, carica la lista invitati da Excel, segui gli arrivi in diretta ed esporta i dati.</p>
          </Link>
          <Link href="/e" className="role-card">
            <div className="num">02 — Ospite</div>
            <h3>Invitato</h3>
            <p>Registrati con nome e cognome e mostra il tuo QR personale il giorno dell&apos;evento.</p>
          </Link>
          <Link href="/checkin" className="role-card">
            <div className="num">03 — Ingresso</div>
            <h3>Check-in / parcheggio</h3>
            <p>Scansiona il QR di ogni invitato all&apos;arrivo e conferma l&apos;ingresso in un tocco.</p>
          </Link>
        </div>

        <div className="footer-note">
          Ogni evento ha un link diretto per gli invitati e uno per il check-in (visibili nelle
          impostazioni dell&apos;evento): condividili invece di questa pagina per saltare la
          selezione manuale.
        </div>
      </div>
    </>
  );
}
