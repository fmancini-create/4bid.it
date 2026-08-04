-- Validazione degli indirizzi prima dell'invio.
--
-- Perche': la lista aeroporti e la prima DEM sono LO STESSO elenco (28.773 su
-- 28.773 in comune). Dove la misura era attiva, quella lista ha reso il 35,2% di
-- rimbalzi; oggi rende il 16,3% grazie alla soppressione automatica dei morti
-- noti. Serve rimuovere i morti ANCORA NON noti, prima di spedirci sopra.
--
-- Due criteri, entrambi misurati sui dati reali di questo progetto:
--  1. DNS/MX assente -> il dominio non puo' piu' ricevere posta (39 domini su 60
--     fra i rimbalzati; controprova: 60 su 60 dei domini di chi ha APERTO
--     l'email superano il controllo, quindi zero falsi positivi osservati);
--  2. frequenza del dominio nella lista -> 1 indirizzo 12,9% di rimbalzi,
--     2-5 -> 11,5%, 6+ -> 2,4% (sotto la soglia del 5%).
--
-- Tutto additivo: nessuna colonna esistente viene modificata o rimossa.

-- Esito per singolo destinatario.
alter table dem_recipients
  add column if not exists validation_status text,
  add column if not exists validation_checked_at timestamptz,
  -- Quanti indirizzi della lista condividono questo dominio: e' il criterio (2),
  -- conservato per poter rileggere la decisione senza ricalcolarla.
  add column if not exists domain_addresses integer;

-- Esito per dominio, in modo che migliaia di indirizzi dello stesso dominio
-- costino UNA sola interrogazione DNS.
create table if not exists dem_domain_checks (
  domain text primary key,
  has_mx boolean,
  -- Distinto da has_mx = false: un errore di rete NON prova che il dominio sia
  -- morto, e trattarlo come tale scarterebbe indirizzi validi.
  check_error text,
  checked_at timestamptz not null default now()
);

-- Interrogato a ogni lotto d'invio.
create index if not exists dem_recipients_validation_idx
  on dem_recipients (campaign_id, validation_status);

-- Consenso esplicito a spedire solo alla fascia sicura: spento per difetto,
-- cosi' la migrazione non cambia il comportamento di nessuna campagna.
alter table dem_campaigns
  add column if not exists send_only_safe boolean not null default false;

comment on column dem_recipients.validation_status is
  'safe | risky | dns_dead | unknown — esito della validazione preventiva';
comment on column dem_campaigns.send_only_safe is
  'Se vero, l''invio salta gli indirizzi non classificati safe';
