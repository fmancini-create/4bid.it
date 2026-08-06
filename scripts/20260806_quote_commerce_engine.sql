-- Quote commerce engine: run once on the 4Bid Supabase project.
-- Apply in staging first and keep a database backup before production.

alter table public.sales_channel_quotes
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists provisioning_status text not null default 'not_required'
    check (provisioning_status in ('not_required','pending','processing','partial','completed','failed','manual_action')),
  add column if not exists provisioning_started_at timestamptz,
  add column if not exists provisioned_at timestamptz;

create table if not exists public.sales_channel_quote_provisioning_jobs (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.sales_channel_quotes(id) on delete cascade,
  project text not null check (project in ('santaddeo','hotelprofitai','manubot')),
  idempotency_key text not null unique,
  status text not null default 'pending'
    check (status in ('pending','processing','succeeded','failed','manual_action')),
  payload jsonb not null default '{}'::jsonb,
  response jsonb,
  attempts integer not null default 0 check (attempts >= 0),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (quote_id, project)
);

create index if not exists idx_quote_provisioning_quote_id
  on public.sales_channel_quote_provisioning_jobs(quote_id);
create index if not exists idx_quote_provisioning_status
  on public.sales_channel_quote_provisioning_jobs(status, created_at);

alter table public.sales_channel_quote_provisioning_jobs enable row level security;
revoke all on public.sales_channel_quote_provisioning_jobs from anon, authenticated;

comment on table public.sales_channel_quote_provisioning_jobs is
  'Idempotent provisioning jobs generated after a quote payment is confirmed by Stripe.';