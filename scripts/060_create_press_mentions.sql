-- Tabella "Parlano di noi": menzioni stampa/notizie online raccolte dal cron Google News.
-- Flusso: cron inserisce in stato 'pending' -> super admin approva/rifiuta -> 'approved' visibili pubblicamente.

create table if not exists public.press_mentions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null,
  source text,                     -- testata/fonte (es. "Il Sole 24 Ore")
  snippet text,                    -- estratto/descrizione se disponibile
  keyword text,                    -- keyword che ha generato il match (es. "Santaddeo")
  published_at timestamptz,        -- data pubblicazione notizia (da RSS)
  image_url text,                  -- eventuale immagine
  status text not null default 'pending',  -- pending | approved | rejected
  url_hash text not null,          -- hash univoco dell'URL normalizzato per dedup
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

-- Dedup: nessuna notizia duplicata (stesso URL)
create unique index if not exists press_mentions_url_hash_key on public.press_mentions (url_hash);
create index if not exists press_mentions_status_idx on public.press_mentions (status);
create index if not exists press_mentions_published_idx on public.press_mentions (published_at desc);

-- RLS
alter table public.press_mentions enable row level security;

-- Pubblico (anon): legge solo le notizie approvate.
-- Tutte le scritture e la lettura dei 'pending' avvengono via service role key
-- (cron + API admin), che bypassa la RLS automaticamente in Supabase.
drop policy if exists "Public can read approved press mentions" on public.press_mentions;
create policy "Public can read approved press mentions"
  on public.press_mentions for select
  to anon
  using (status = 'approved');
