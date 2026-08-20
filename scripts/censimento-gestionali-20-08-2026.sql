-- Censimento del gestionale (PMS) delle strutture a cui mandiamo le DEM.
--
-- PERCHE'. Le tabelle `hospitality_*` esistevano gia' sul database ma erano VUOTE
-- e nessuna riga di codice le citava: uno scheletro mai riempito. Il committente
-- chiede di poter filtrare le DEM per gestionale, e questo file mette in piedi la
-- semina; il riconoscimento vero e proprio sta nel codice dell'applicazione.
--
-- PERIMETRO, deciso dal committente: i 17.904 domini dei destinatari DEM. Non le
-- 268 strutture Scidoo, perche' solo 33 di quelle sono fra i destinatari: filtrare
-- su quelle avrebbe prodotto liste da 33 indirizzi.

-- ---------------------------------------------------------------------------
-- 1. Domini di posta personale
-- ---------------------------------------------------------------------------
-- TRAPPOLA MISURATA: i destinatari DEM stanno per una buona parte su caselle
-- personali o di provider (libero.it 1.874 indirizzi, tin.it 1.231, gmail.com
-- 1.051, tiscali.it 595...). Raggruppando per dominio, `libero.it` sarebbe
-- diventata UNA struttura con 1.874 indirizzi di alberghi diversi fra loro.
--
-- L'elenco sta in tabella e NON in un array dentro la funzione: aggiungere un
-- provider non deve richiedere un rilascio del codice. Se stesse in due posti,
-- il secondo non verrebbe aggiornato.
CREATE TABLE IF NOT EXISTS hospitality_consumer_domains (
  domain      text PRIMARY KEY,
  note        text,
  added_at    timestamptz NOT NULL DEFAULT now()
);

INSERT INTO hospitality_consumer_domains (domain, note) VALUES
  ('gmail.com','posta personale'), ('googlemail.com','posta personale'),
  ('libero.it','provider italiano'), ('tin.it','provider italiano'),
  ('tiscali.it','provider italiano'), ('tiscalinet.it','provider italiano'),
  ('virgilio.it','provider italiano'), ('inwind.it','provider italiano'),
  ('iol.it','provider italiano'), ('alice.it','provider italiano'),
  ('interfree.it','provider italiano'), ('katamail.com','provider italiano'),
  ('dada.it','provider italiano'), ('flashnet.it','provider italiano'),
  ('fastwebnet.it','provider italiano'), ('infinito.it','provider italiano'),
  ('supereva.it','provider italiano'), ('jumpy.it','provider italiano'),
  ('email.it','provider italiano'), ('poste.it','provider italiano'),
  ('tim.it','provider italiano'), ('vodafone.it','provider italiano'),
  ('teletu.it','provider italiano'), ('wind.it','provider italiano'),
  ('hotmail.com','posta personale'), ('hotmail.it','posta personale'),
  ('outlook.com','posta personale'), ('outlook.it','posta personale'),
  ('live.com','posta personale'), ('live.it','posta personale'),
  ('msn.com','posta personale'), ('aol.com','posta personale'),
  ('yahoo.com','posta personale'), ('yahoo.it','posta personale'),
  ('icloud.com','posta personale'), ('me.com','posta personale'),
  ('mac.com','posta personale'), ('protonmail.com','posta personale'),
  ('proton.me','posta personale'), ('pm.me','posta personale'),
  ('gmx.de','provider estero'), ('gmx.net','provider estero'),
  ('web.de','provider estero'), ('t-online.de','provider estero'),
  ('wanadoo.fr','provider estero'), ('orange.fr','provider estero'),
  ('free.fr','provider estero'), ('laposte.net','provider estero'),
  ('bluewin.ch','provider estero'), ('yandex.ru','provider estero'),
  ('mail.ru','provider estero'), ('qq.com','provider estero'),
  ('163.com','provider estero'), ('sfr.fr','provider estero'),
  ('terra.es','provider estero'), ('telefonica.net','provider estero'),
  -- provider di connettivita' locali visti nei dati reali
  ('dnet.it','provider locale'), ('rolmail.net','provider locale'),
  ('elbalink.it','provider locale'), ('interbusiness.it','provider locale'),
  ('cheapnet.it','provider locale'), ('freemail.it','provider locale')
ON CONFLICT (domain) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. Le candidate alla semina
-- ---------------------------------------------------------------------------
-- Due regole diverse, perche' i due casi sono diversi per natura:
--
--  * dominio PROPRIO (hotelrossi.it) -> UNA struttura, con tutti i suoi indirizzi
--    raggruppati. Il sito e' ricavabile dal dominio, quindi il gestionale e'
--    cercabile.
--  * casella PERSONALE (mario@libero.it) -> UNA candidata per indirizzo, senza
--    sito. Il gestionale NON e' cercabile, e va detto: finiranno in `no_website`,
--    non fra i "nessun gestionale". Non sapere e non avere sono cose diverse.
CREATE OR REPLACE VIEW hospitality_seed_candidates AS
WITH base AS (
  SELECT DISTINCT
    lower(trim(r.email))                          AS email,
    lower(split_part(trim(r.email), '@', 2))      AS dominio,
    nullif(trim(coalesce(r.nome_azienda, '')), '') AS azienda
  FROM dem_recipients r
  WHERE r.email LIKE '%@%' AND trim(r.email) <> ''
),
marcata AS (
  SELECT b.*, (c.domain IS NOT NULL) AS personale
  FROM base b
  LEFT JOIN hospitality_consumer_domains c ON c.domain = b.dominio
)
SELECT
  'host:' || dominio                                   AS identity_key,
  coalesce(min(azienda), dominio)                      AS name,
  min(email)                                           AS email,
  array_agg(DISTINCT email)                            AS emails,
  dominio                                              AS website_host,
  'https://' || dominio                                AS website_url,
  'unknown'::text                                      AS technology_status
FROM marcata
WHERE NOT personale
GROUP BY dominio
UNION ALL
SELECT
  'email:' || email                                    AS identity_key,
  coalesce(azienda, split_part(email, '@', 1))         AS name,
  email                                                AS email,
  ARRAY[email]                                         AS emails,
  NULL::text                                           AS website_host,
  NULL::text                                           AS website_url,
  -- Stato onesto: non e' "nessun gestionale", e' "non possiamo cercarlo".
  'no_website'::text                                   AS technology_status
FROM marcata
WHERE personale;

-- ---------------------------------------------------------------------------
-- 3. Semina a lotti
-- ---------------------------------------------------------------------------
-- Avanza di `p_limit` candidate per chiamata usando `seed_offset` come segnaposto,
-- e mette in coda per il riconoscimento solo quelle che hanno un sito.
CREATE OR REPLACE FUNCTION censimento_semina_lotto(p_limit integer DEFAULT 500)
RETURNS TABLE (inserite integer, in_coda integer, nuovo_offset integer, totale integer, esaurito boolean)
LANGUAGE plpgsql
AS $$
DECLARE
  v_offset  integer;
  v_totale  integer;
  v_ins     integer := 0;
  v_coda    integer := 0;
BEGIN
  SELECT seed_offset INTO v_offset FROM hospitality_census_state WHERE id = 1;
  IF v_offset IS NULL THEN
    RAISE EXCEPTION 'hospitality_census_state riga 1 assente: il censimento non e'' inizializzato';
  END IF;

  SELECT count(*)::int INTO v_totale FROM hospitality_seed_candidates;

  CREATE TEMP TABLE _lotto ON COMMIT DROP AS
    SELECT * FROM hospitality_seed_candidates
    ORDER BY identity_key
    OFFSET v_offset LIMIT p_limit;

  WITH ins AS (
    INSERT INTO hospitality_properties (
      identity_key, name, email, emails, phones, website_host, website_url,
      country, technology_status, contact_quality, source_names, source_data,
      is_active, first_seen_at, last_seen_at, updated_at
    )
    SELECT
      l.identity_key, l.name, l.email, l.emails, '{}'::text[], l.website_host, l.website_url,
      'Italia', l.technology_status,
      -- Qualita' del contatto: un dominio proprio e' un segnale migliore di una
      -- casella personale, e piu' indirizzi valgono piu' di uno.
      least(100, 40 + (CASE WHEN l.website_host IS NOT NULL THEN 30 ELSE 0 END)
                    + least(30, coalesce(array_length(l.emails, 1), 1) * 10))::smallint,
      ARRAY['dem_recipients'], jsonb_build_object('seminato_da', 'dem_recipients'),
      true, now(), now(), now()
    FROM _lotto l
    ON CONFLICT (identity_key) DO UPDATE
      SET emails      = (SELECT array_agg(DISTINCT e) FROM unnest(hospitality_properties.emails || excluded.emails) e),
          last_seen_at = now(),
          updated_at   = now()
    RETURNING id, website_host
  )
  SELECT count(*)::int INTO v_ins FROM ins;

  -- In coda solo chi ha un sito: senza sito non c'e' niente da guardare.
  WITH coda AS (
    INSERT INTO hospitality_crawl_queue (property_id, status, priority)
    SELECT p.id, 'pending', 0
    FROM hospitality_properties p
    JOIN _lotto l ON l.identity_key = p.identity_key
    WHERE p.website_host IS NOT NULL
    ON CONFLICT (property_id) DO NOTHING
    RETURNING property_id
  )
  SELECT count(*)::int INTO v_coda FROM coda;

  v_offset := v_offset + p_limit;

  UPDATE hospitality_census_state
     SET seed_offset          = least(v_offset, v_totale),
         seed_total           = v_totale,
         seeded_count         = (SELECT count(*)::int FROM hospitality_properties),
         crawl_queued_count   = (SELECT count(*)::int FROM hospitality_crawl_queue),
         seed_status          = CASE WHEN v_offset >= v_totale THEN 'completed' ELSE 'running' END,
         last_batch_started_at = coalesce(last_batch_started_at, now()),
         last_batch_finished_at = now(),
         version              = version + 1,
         updated_at           = now()
   WHERE id = 1;

  RETURN QUERY SELECT v_ins, v_coda, least(v_offset, v_totale), v_totale, (v_offset >= v_totale);
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. Conteggi per la pagina e per il filtro DEM
-- ---------------------------------------------------------------------------
-- Una funzione sola, cosi' la pagina e il filtro leggono gli STESSI numeri.
-- Due query separate sarebbero il modo piu' sicuro per farli divergere.
CREATE OR REPLACE FUNCTION censimento_per_gestionale()
RETURNS TABLE (gestionale text, strutture integer, indirizzi integer, stato text)
LANGUAGE sql
STABLE
AS $$
  SELECT
    coalesce(p.pms_provider, '(non rilevato)')          AS gestionale,
    count(*)::int                                       AS strutture,
    coalesce(sum(array_length(p.emails, 1)), 0)::int    AS indirizzi,
    CASE
      WHEN p.pms_provider IS NOT NULL THEN 'rilevato'
      ELSE p.technology_status
    END                                                 AS stato
  FROM hospitality_properties p
  WHERE p.is_active
  GROUP BY 1, 4
  ORDER BY 2 DESC;
$$;

-- Indici per il filtro: senza questi, ogni caricamento di destinatari
-- scandirebbe l'intera tabella.
CREATE INDEX IF NOT EXISTS idx_hosp_pms_provider ON hospitality_properties (pms_provider) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_hosp_tech_status  ON hospitality_properties (technology_status) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_hosp_be_provider  ON hospitality_properties (booking_engine_provider) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_hosp_queue_next   ON hospitality_crawl_queue (status, next_attempt_at);
