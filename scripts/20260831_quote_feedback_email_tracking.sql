alter table public.sales_channel_quotes
  add column if not exists feedback_email_opened_at timestamptz,
  add column if not exists feedback_email_open_count integer not null default 0,
  add column if not exists feedback_link_clicked_at timestamptz,
  add column if not exists feedback_link_click_count integer not null default 0;
