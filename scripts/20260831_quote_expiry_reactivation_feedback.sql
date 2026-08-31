alter table public.sales_channel_quotes
  add column if not exists expiry_reminder_sent_at timestamptz,
  add column if not exists feedback_requested_at timestamptz,
  add column if not exists feedback_received_at timestamptz,
  add column if not exists feedback_reason text,
  add column if not exists feedback_note text,
  add column if not exists reactivation_requested_at timestamptz,
  add column if not exists reactivation_notified_at timestamptz;

comment on column public.sales_channel_quotes.expiry_reminder_sent_at is 'Promemoria di scadenza inviato al cliente circa 24 ore prima della scadenza.';
comment on column public.sales_channel_quotes.feedback_requested_at is 'Richiesta feedback inviata dopo la scadenza di un preventivo non accettato.';
comment on column public.sales_channel_quotes.feedback_received_at is 'Data di ricezione del feedback sul motivo della mancata accettazione.';
comment on column public.sales_channel_quotes.feedback_reason is 'Motivo strutturato della mancata accettazione del preventivo.';
comment on column public.sales_channel_quotes.feedback_note is 'Nota libera lasciata dal cliente nel feedback.';
comment on column public.sales_channel_quotes.reactivation_requested_at is 'Ultima richiesta del cliente di riattivare un preventivo scaduto.';
comment on column public.sales_channel_quotes.reactivation_notified_at is 'Data di notifica al superadmin della richiesta di riattivazione.';
