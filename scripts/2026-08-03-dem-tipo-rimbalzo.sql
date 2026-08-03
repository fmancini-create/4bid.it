-- Salva il TIPO di rimbalzo che Resend invia e che finora veniva buttato.
--
-- Il webhook scriveva `error_message = 'Resend email.bounced'` per tutti,
-- rendendo i rimbalzi indistinguibili: "ripulire la lista" era un'istruzione
-- non eseguibile, perche' non si sapeva QUALI indirizzi fossero morti.
--
-- Resend documenta `data.bounce.{type,subType,message}` dove `type` vale
-- `Permanent` (indirizzo inesistente) oppure `Temporary` (es. casella piena).
-- Verificato su resend.com/docs/webhooks/emails/bounced.
--
-- Tutto additivo e idempotente: nessun dato esistente viene modificato.
-- La colonna `reason` NON viene toccata, perche' la pagina Disiscrizioni la
-- legge e cambiarne i valori romperebbe le etichette esistenti.

alter table public.dem_unsubscribes
  add column if not exists bounce_type text,
  add column if not exists bounce_subtype text,
  add column if not exists bounce_message text;

-- Sui destinatari serve per rispondere direttamente a "quali indirizzi sono
-- morti in questa campagna", senza passare dalla lista globale.
alter table public.dem_recipients
  add column if not exists bounce_type text;

-- Le righe storiche restano NULL: il dato non era stato salvato e non e'
-- ricostruibile a posteriori (non conserviamo l'email_id di Resend, quindi non
-- si possono nemmeno rileggere dalla loro API). NULL significa "tipo non
-- registrato", che e' diverso da "temporaneo": va letto come sconosciuto.
comment on column public.dem_recipients.bounce_type is
  'Permanent | Temporary | Unknown. NULL = rimbalzo avvenuto prima del 03/08/2026, tipo non registrato.';

create index if not exists idx_dem_recipients_bounce_type
  on public.dem_recipients (bounce_type)
  where bounce_type is not null;
