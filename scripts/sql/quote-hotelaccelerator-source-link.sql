-- Applied to the 4BID Supabase project.
-- Keeps 4BID as the authoritative quote store while allowing HotelAccelerator CRM
-- to address quotes idempotently and group revisions under a deal.

alter table public.sales_channel_quotes
  add column if not exists source_system text,
  add column if not exists source_record_id text,
  add column if not exists source_parent_id text,
  add column if not exists source_metadata jsonb not null default '{}'::jsonb;

create unique index if not exists sales_channel_quotes_source_record_uidx
  on public.sales_channel_quotes (source_system, source_record_id)
  where source_system is not null and source_record_id is not null;

create index if not exists sales_channel_quotes_source_parent_idx
  on public.sales_channel_quotes (source_system, source_parent_id)
  where source_system is not null and source_parent_id is not null;
