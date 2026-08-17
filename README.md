# BattiBecco — Arrivi invitati e check-in QR

Web app per la gestione degli arrivi invitati a matrimoni ed eventi privati:
registrazione ospiti, QR code personale e check-in al parcheggio con dashboard
in tempo reale per lo staff.

Stack: **Next.js 14** (App Router, TypeScript) + **Supabase** (database
Postgres, autenticazione amministratore) + **Tailwind CSS**, pronta per il
deploy su **Vercel**.

## Struttura rapida

- `/` — pagina di scelta ruolo (amministratore / invitato / check-in)
- `/admin` — area riservata: crea eventi, importa Excel, dashboard, esporta
- `/e/[eventId]` — pagina pubblica di registrazione invitato e QR personale
- `/checkin/[eventId]` — postazione staff con scanner fotocamera
- `supabase/schema.sql` — schema del database da eseguire una tantum

## Avvio in locale

```bash
npm install
cp .env.example .env.local   # poi compila le chiavi Supabase
npm run dev
```

Apri http://localhost:3000

**Per le istruzioni complete di configurazione Supabase e pubblicazione sul
tuo sito, leggi [`DEPLOY.md`](./DEPLOY.md).**

## Sicurezza, in breve

- Il browser non ha mai accesso diretto al database: ogni lettura/scrittura
  passa dalle API route del server, che usano la chiave "service role" di
  Supabase (mai esposta al client).
- Row Level Security attiva su tutte le tabelle sensibili, senza policy per
  utenti anonimi: la pagina pubblica invitato non può in alcun modo leggere
  l'elenco completo degli iscritti.
- Il QR non contiene nome, cognome né altri dati personali: solo un token
  casuale collegato al record dell'invitato nel database.
- Le API pubbliche (registrazione, check-in) hanno un limite di richieste
  per indirizzo IP (vedi `src/lib/rateLimit.ts` e la nota su Upstash in
  `DEPLOY.md` per una versione più robusta in produzione).
- L'accesso amministratore usa Supabase Auth (email + password reale, non
  una password fissa nel codice).

## Roadmap non ancora implementata

Per restare fedele alla "versione iniziale" richiesta, non sono ancora
presenti: gestione di gruppi/nuclei familiari (il database è già pronto ad
accoglierla), invio automatico di email/SMS agli invitati, multi-operatore
con log per singolo account di check-in.
