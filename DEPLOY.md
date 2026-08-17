# Guida alla pubblicazione

Segui questi passaggi in ordine. Non serve esperienza precedente con
Supabase o Vercel: sono entrambi servizi con un piano gratuito sufficiente
per un evento come un matrimonio.

## 1. Crea il progetto Supabase (il database)

1. Vai su https://supabase.com → crea un account gratuito → "New project".
2. Scegli un nome (es. "battibecco-arrivi"), una password per il database
   (salvala da parte, non serve nell'app ma è bene conservarla) e una
   regione vicina a te (es. Frankfurt/EU). rnjszL5aSOVCSlzB
3. Attendi il provisioning (1-2 minuti).
4. Vai su **SQL Editor** (menu a sinistra) → "New query" → incolla tutto il
   contenuto del file `supabase/schema.sql` di questo progetto → **Run**.
   Questo crea le tabelle `events`, `guests`, `check_ins`, `admin_profiles`
   e le regole di sicurezza.
5. Vai su **Project Settings → API**. Ti servono tre valori per il passo 3:
   - `Project URL`
   - `anon public` key
   - `service_role` key (sotto "Project API keys" — tienila segreta)

### Crea il tuo utente amministratore

1. Sempre in Supabase, vai su **Authentication → Users → Add user**.
2. Inserisci la tua email e una password sicura. Conferma la creazione.
3. Copia l'**UUID** dell'utente appena creato (visibile nella lista utenti).
4. Torna in **SQL Editor** ed esegui, sostituendo i valori:
   ```sql
   insert into admin_profiles (id, email) values ('INCOLLA-QUI-UUID', 'tuaemail@esempio.it');
   ```
5. Questa è l'email/password con cui accederai su `/admin/login`.

Per aggiungere altri amministratori in futuro, ripeti questi due passaggi.

## 2. Pubblica il sito su Vercel

1. Carica questa cartella su un repository GitHub (puoi trascinare i file
   dall'interfaccia web di GitHub se non usi mai la riga di comando: crea
   un nuovo repository vuoto, poi "Upload files").
2. Vai su https://vercel.com → accedi con GitHub → "Add New… → Project" →
   seleziona il repository appena creato.
3. Nella schermata di configurazione, apri **Environment Variables** e
   aggiungi le tre chiavi ottenute al passo 1:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Premi **Deploy**. Dopo 1-2 minuti avrai un indirizzo del tipo
   `https://battibecco-arrivi.vercel.app`, già in HTTPS (necessario per far
   funzionare la fotocamera nella pagina di check-in).
5. Prova subito il flusso: apri il sito → Amministratore → accedi → crea un
   evento → importa un Excel di prova → apri il link invitato in un'altra
   scheda → registrati → apri il link check-in su un telefono e scansiona.

### Dominio personalizzato (opzionale)

In Vercel → **Settings → Domains** puoi collegare un dominio o
sottodominio tuo (es. `arrivi.battibecco.it`), seguendo le istruzioni DNS
mostrate a schermo. Non è obbligatorio: il dominio `.vercel.app` gratuito
funziona perfettamente per l'evento.

## 3. Integrazione nel sito WordPress

Hai due opzioni, come indicato nel documento dei requisiti:

**A. Link diretto** (più semplice): metti un pulsante o una voce di menu
sul sito del ristorante che punta a `https://tuo-dominio/e/ID-EVENTO` per
gli invitati. Nessuna modifica tecnica al sito.

**B. Incorporamento tramite iframe**: in una pagina o widget HTML di
WordPress, incolla:

```html
<iframe
  src="https://tuo-dominio/e/ID-EVENTO"
  style="width:100%; height:820px; border:0; border-radius:12px;"
  loading="lazy">
</iframe>
```

Sostituisci l'URL con quello dell'area che vuoi mostrare (`/e/...` per gli
invitati, `/checkin/...` per lo staff — quest'ultimo di solito si apre
direttamente sul telefono del parcheggio, non incorporato nel sito).

L'ID di ogni evento e i link già pronti si trovano nella scheda
**Impostazioni** dell'evento, dentro l'area amministratore.

## 4. Il giorno dell'evento

- Assicurati che il telefono/tablet dello staff al parcheggio abbia una
  connessione dati o Wi-Fi stabile: la pagina di check-in ha bisogno di
  rete per verificare ogni QR.
- Apri `/checkin/ID-EVENTO` sul browser del telefono (Safari su iPhone,
  Chrome su Android) e concedi il permesso per la fotocamera quando
  richiesto.
- A fine serata, vai su **Impostazioni** dell'evento nell'area
  amministratore e imposta lo stato su **Chiuso**: i QR smettono
  immediatamente di essere accettati.
- Esporta la lista finale in Excel dalla scheda **Invitati**.

## Note per andare oltre l'MVP

- **Rate limiting più robusto**: il limite attuale (`src/lib/rateLimit.ts`)
  è in memoria e sufficiente per un evento singolo di dimensioni
  ragionevoli. Per maggiore robustezza in caso di traffico anomalo,
  sostituiscilo con [Upstash Redis](https://upstash.com) (piano gratuito
  disponibile) usando il pacchetto `@upstash/ratelimit`.
- **Notifiche in tempo reale più efficienti**: la dashboard amministratore
  oggi si aggiorna con un polling ogni 4 secondi. Per un evento con molti
  invitati o più operatori di check-in, puoi passare a
  [Supabase Realtime](https://supabase.com/docs/guides/realtime) creando
  una vista pubblica ridotta (solo conteggi aggregati, mai nomi) e
  sottoscrivendola dal client con la chiave anonima.
- **Gruppi familiari**: lo schema del database (`event_id` su ogni
  invitato, tabella separata dai check-in) è già predisposto per
  aggiungere in futuro un raggruppamento per nucleo familiare, come
  indicato nel documento dei requisiti originale.
