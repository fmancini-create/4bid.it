-- Tracciamento degli inoltri dalla pagina pubblica del preventivo.
-- Eseguire una sola volta sul progetto Supabase 4BID prima di usare la funzione.

create table if not exists public.sales_channel_quote_shares (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.sales_channel_quotes(id) on delete cascade,
  token uuid not null default gen_random_uuid() unique,
  recipient_email text not null,
  forwarded_by_share_id uuid references public.sales_channel_quote_shares(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz,
  send_count integer not null default 0 check (send_count >= 0),
  first_email_opened_at timestamptz,
  last_email_opened_at timestamptz,
  email_open_count integer not null default 0 check (email_open_count >= 0),
  first_viewed_at timestamptz,
  last_viewed_at timestamptz,
  view_count integer not null default 0 check (view_count >= 0),
  last_error text,
  constraint sales_channel_quote_shares_quote_email_key unique (quote_id, recipient_email)
);

create index if not exists idx_scq_shares_quote
  on public.sales_channel_quote_shares(quote_id, created_at desc);
create index if not exists idx_scq_shares_token
  on public.sales_channel_quote_shares(token);
create index if not exists idx_scq_shares_opened
  on public.sales_channel_quote_shares(quote_id, first_email_opened_at);
create index if not exists idx_scq_shares_viewed
  on public.sales_channel_quote_shares(quote_id, first_viewed_at);

create table if not exists public.sales_channel_quote_share_events (
  id uuid primary key default gen_random_uuid(),
  share_id uuid not null references public.sales_channel_quote_shares(id) on delete cascade,
  quote_id uuid not null references public.sales_channel_quotes(id) on delete cascade,
  event_type text not null check (event_type in ('forwarded', 'email_sent', 'email_failed', 'email_opened', 'page_viewed')),
  recipient_email text not null,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_scq_share_events_quote
  on public.sales_channel_quote_share_events(quote_id, occurred_at desc);
create index if not exists idx_scq_share_events_share
  on public.sales_channel_quote_share_events(share_id, occurred_at desc);
create index if not exists idx_scq_share_events_type
  on public.sales_channel_quote_share_events(event_type, occurred_at desc);

alter table public.sales_channel_quote_shares enable row level security;
alter table public.sales_channel_quote_share_events enable row level security;

revoke all on public.sales_channel_quote_shares from anon, authenticated;
revoke all on public.sales_channel_quote_share_events from anon, authenticated;
grant all on public.sales_channel_quote_shares to service_role;
grant all on public.sales_channel_quote_share_events to service_role;

comment on table public.sales_channel_quote_shares is
  'Link personali di sola consultazione creati quando un preventivo pubblico viene inoltrato.';
comment on table public.sales_channel_quote_share_events is
  'Eventi analitici degli inoltri: invio, apertura email e visualizzazione del preventivo.';
comment on column public.sales_channel_quote_shares.first_email_opened_at is
  'Apertura email indicativa: alcuni client possono precaricare o bloccare le immagini.';
comment on column public.sales_channel_quote_shares.first_viewed_at is
  'Prima richiesta effettiva della pagina personale di sola consultazione.';
