-- ============================================================
-- BattiBecco — Gestione arrivi invitati e check-in QR
-- Schema Supabase (Postgres). Eseguire nel SQL Editor del progetto.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- EVENTS ----------
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  date date,
  description text,
  status text not null default 'active' check (status in ('active','closed')),
  slot_minutes int not null default 30,
  created_at timestamptz not null default now()
);

-- ---------- GUESTS ----------
create table if not exists guests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  expected_arrival text, -- formato HH:MM
  registration_status text not null default 'not_registered' check (registration_status in ('not_registered','registered')),
  qr_token text not null unique,
  checked_in boolean not null default false,
  check_in_time text,
  check_in_timestamp timestamptz,
  operator text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists guests_event_id_idx on guests(event_id);
create index if not exists guests_qr_token_idx on guests(qr_token);
create index if not exists guests_name_idx on guests(event_id, lower(first_name), lower(last_name));

-- ---------- CHECK-IN LOG (storico, utile per audit / esportazioni dettagliate) ----------
create table if not exists check_ins (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references guests(id) on delete cascade,
  event_id uuid not null references events(id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  operator text
);

create index if not exists check_ins_event_id_idx on check_ins(event_id);

-- ---------- ADMIN PROFILES (collega auth.users a un ruolo) ----------
create table if not exists admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

-- ---------- updated_at automatico su guests ----------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists guests_set_updated_at on guests;
create trigger guests_set_updated_at
  before update on guests
  for each row execute procedure set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- Tutte le tabelle sensibili sono bloccate di default: nessuna
-- policy per i ruoli "anon" o "authenticated". L'applicazione
-- Next.js accede sempre tramite le proprie API route lato server,
-- usando la service role key (che bypassa RLS). In questo modo:
--  - la pagina pubblica invitato non può mai leggere l'intera lista;
--  - solo il backend, dopo aver verificato la sessione admin o la
--    logica di business (nome+cognome, token QR), legge/scrive dati.
-- ============================================================

alter table events enable row level security;
alter table guests enable row level security;
alter table check_ins enable row level security;
alter table admin_profiles enable row level security;

-- Un amministratore autenticato può leggere il proprio profilo
-- (utile lato client per mostrare nome/ruolo senza passare dal backend).
create policy "admin can read own profile"
  on admin_profiles for select
  using (auth.uid() = id);

-- ============================================================
-- Creazione di un utente amministratore:
-- 1) Vai su Supabase → Authentication → Users → "Add user".
-- 2) Crea l'utente con email e password.
-- 3) Esegui questa riga sostituendo l'UUID e l'email con quelli
--    dell'utente appena creato (visibili nella dashboard):
--
-- insert into admin_profiles (id, email) values ('UUID-UTENTE', 'email@esempio.it');
-- ============================================================
