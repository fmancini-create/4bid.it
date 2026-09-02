create table if not exists public.quote_live_sales_sessions (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.sales_channel_quotes(id) on delete cascade,
  chat_conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  provider text not null default 'tavus',
  provider_conversation_id text not null,
  status text not null default 'active' check (status in ('creating','active','ended','failed')),
  transcript jsonb not null default '[]'::jsonb,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  last_event_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_conversation_id)
);

create index if not exists quote_live_sales_sessions_quote_idx
  on public.quote_live_sales_sessions (quote_id, created_at desc);
create index if not exists quote_live_sales_sessions_chat_idx
  on public.quote_live_sales_sessions (chat_conversation_id);
create index if not exists quote_live_sales_sessions_status_idx
  on public.quote_live_sales_sessions (status, updated_at desc);

alter table public.quote_live_sales_sessions enable row level security;
comment on table public.quote_live_sales_sessions is
  'Server-side tracking for real-time AI video sales conversations attached to public quotes. No public RLS policy by design.';
