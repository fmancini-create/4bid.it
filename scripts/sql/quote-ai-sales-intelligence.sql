-- Quote AI sales intelligence. Applied to production on 2026-09-03.
create table if not exists public.quote_ai_sales_intelligence (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  quote_id uuid references public.sales_channel_quotes(id) on delete cascade,
  quote_number text,
  recipient_email text,
  engagement_score smallint not null default 0 check (engagement_score between 0 and 100),
  temperature text not null default 'cold' check (temperature in ('cold','warm','hot')),
  intent text,
  primary_product text,
  interested_products text[] not null default '{}',
  objections text[] not null default '{}',
  positive_signals text[] not null default '{}',
  next_best_action text,
  rationale text,
  last_user_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (conversation_id)
);
create index if not exists quote_ai_sales_intelligence_quote_idx on public.quote_ai_sales_intelligence (quote_id, updated_at desc);
create index if not exists quote_ai_sales_intelligence_score_idx on public.quote_ai_sales_intelligence (engagement_score desc, updated_at desc);
alter table public.quote_ai_sales_intelligence enable row level security;
comment on table public.quote_ai_sales_intelligence is 'Server-only sales intelligence derived from explicit quote chat signals. Scores are indicative engagement/readiness signals, not guaranteed close probabilities.';
