-- Censimento gestionali: prelievo del lotto e registrazione degli esiti.
--
-- Sta in SQL e non in JavaScript per una ragione precisa: il prelievo deve essere
-- ATOMICO. Con il cron ogni minuto due esecuzioni si sovrappongono facilmente, e
-- senza `FOR UPDATE SKIP LOCKED` entrambe leggerebbero le stesse righe `pending`
-- e visiterebbero due volte gli stessi siti -- lavoro doppio verso terzi, che e'
-- esattamente cio' che non si deve fare quando si interrogano server di altri.

-- ---------------------------------------------------------------------------
-- 1. Recupero delle righe appese
-- ---------------------------------------------------------------------------
-- Se una funzione muore a metà (timeout, rilascio, errore di rete) le sue righe
-- restano `processing` PER SEMPRE: la coda mostrerebbe lavoro in corso che nessuno
-- sta facendo, e il censimento non arriverebbe mai al 100%. Senza questo recupero
-- il difetto sarebbe invisibile, perche' i conteggi continuerebbero a sembrare sani.
CREATE OR REPLACE FUNCTION censimento_recupera_appese(p_minuti integer DEFAULT 10)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE v_n integer;
BEGIN
  WITH rec AS (
    UPDATE hospitality_crawl_queue
       SET status = 'pending', updated_at = now()
     WHERE status = 'processing'
       AND last_attempt_at < now() - make_interval(mins => p_minuti)
    RETURNING property_id
  )
  SELECT count(*)::int INTO v_n FROM rec;
  RETURN v_n;
END;
$$;

-- ---------------------------------------------------------------------------
-- 2. Prelievo atomico del lotto
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS censimento_prendi_lotto(integer, integer);

CREATE OR REPLACE FUNCTION censimento_prendi_lotto(
  p_limit    integer DEFAULT 100,
  p_max_tent integer DEFAULT 3
)
RETURNS TABLE (property_id uuid, website_url text, website_host text, attempts integer)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH presi AS (
    SELECT q.property_id
      FROM hospitality_crawl_queue q
     WHERE q.status = 'pending'
       -- Un sito che ha già fallito N volte non va ritentato all'infinito:
       -- occuperebbe il lotto impedendo di arrivare a quelli mai provati.
       AND q.attempts < p_max_tent
       AND (q.next_attempt_at IS NULL OR q.next_attempt_at <= now())
     ORDER BY q.priority DESC, q.property_id
     LIMIT p_limit
     -- SKIP LOCKED: due esecuzioni sovrapposte prendono lotti DISGIUNTI invece
     -- di aspettarsi o di duplicare il lavoro.
     FOR UPDATE SKIP LOCKED
  ),
  agg AS (
    UPDATE hospitality_crawl_queue q
       SET status          = 'processing',
           attempts        = q.attempts + 1,
           last_attempt_at = now(),
           updated_at      = now()
      FROM presi
     WHERE q.property_id = presi.property_id
    RETURNING q.property_id, q.attempts
  )
  SELECT a.property_id, p.website_url, p.website_host, a.attempts
    FROM agg a
    JOIN hospitality_properties p ON p.id = a.property_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. Host di prenotazione sconosciuti
-- ---------------------------------------------------------------------------
-- Serve a far CRESCERE l'elenco dei fornitori riconosciuti. Se 200 strutture
-- puntano allo stesso host che non riconosciamo, quello e' un gestionale che ci
-- manca. Senza questo, la copertura resterebbe ferma alle 16 firme di oggi e non
-- sapremmo nemmeno cosa ci sfugge.
CREATE OR REPLACE FUNCTION censimento_registra_host_sconosciuto(
  p_host text,
  p_url  text
)
RETURNS void
LANGUAGE sql
AS $$
  -- `sample_urls` e' jsonb, NON text[]: il tipo va letto dallo schema, non
  -- dedotto dal nome. Un `ARRAY[...]` qui faceva fallire l'intera migrazione.
  INSERT INTO hospitality_unknown_booking_hosts (host, occurrences, sample_urls, first_seen_at, last_seen_at)
  VALUES (lower(p_host), 1, jsonb_build_array(p_url), now(), now())
  ON CONFLICT (host) DO UPDATE
    SET occurrences  = hospitality_unknown_booking_hosts.occurrences + 1,
        -- Massimo 5 esempi: servono a capire di che fornitore si tratta, non a
        -- conservare ogni URL visto. Un elenco che cresce senza limite su 17.855
        -- strutture diventa un problema di spazio e di lettura.
        --
        -- `ORDER BY u` non e' estetico: senza un ordine, `LIMIT 5` sceglie 5
        -- elementi QUALSIASI, quindi a parita' di dati la colonna cambierebbe a
        -- ogni chiamata e non si potrebbe piu' verificare nulla.
        sample_urls  = (
          SELECT coalesce(jsonb_agg(u ORDER BY u), '[]'::jsonb)
            FROM (
              SELECT DISTINCT jsonb_array_elements_text(
                       hospitality_unknown_booking_hosts.sample_urls || jsonb_build_array(p_url)
                     ) AS u
               ORDER BY 1
               LIMIT 5
            ) s
        ),
        last_seen_at = now();
$$;

-- ---------------------------------------------------------------------------
-- 4. Contatori dello stato
-- ---------------------------------------------------------------------------
-- Ricalcolati dai dati veri, non incrementati a mano. Un contatore incrementato
-- si disallinea al primo errore e poi mente per sempre; ricalcolarlo costa una
-- scansione ma dice la verita'.
CREATE OR REPLACE FUNCTION censimento_aggiorna_contatori()
RETURNS void
LANGUAGE sql
AS $$
  UPDATE hospitality_census_state
     SET crawl_processed_count = (SELECT count(*)::int FROM hospitality_crawl_queue WHERE status = 'completed'),
         crawl_failed_count    = (SELECT count(*)::int FROM hospitality_crawl_queue WHERE status = 'failed'),
         crawl_queued_count    = (SELECT count(*)::int FROM hospitality_crawl_queue),
         detected_count        = (SELECT count(*)::int FROM hospitality_properties WHERE technology_status = 'detected'),
         unknown_count         = (SELECT count(*)::int FROM hospitality_properties WHERE technology_status = 'unknown'),
         last_batch_finished_at = now(),
         version               = version + 1,
         updated_at            = now()
   WHERE id = 1;
$$;

-- ---------------------------------------------------------------------------
-- 5. Avanzamento leggibile
-- ---------------------------------------------------------------------------
-- Una vista sola, cosi' la pagina e le mie sonde leggono gli STESSI numeri.
CREATE OR REPLACE VIEW hospitality_censimento_avanzamento AS
  SELECT
    (SELECT count(*)::int FROM hospitality_properties)                                    AS strutture,
    (SELECT count(*)::int FROM hospitality_crawl_queue)                                   AS in_coda,
    (SELECT count(*)::int FROM hospitality_crawl_queue WHERE status = 'pending')          AS da_fare,
    (SELECT count(*)::int FROM hospitality_crawl_queue WHERE status = 'processing')       AS in_corso,
    (SELECT count(*)::int FROM hospitality_crawl_queue WHERE status = 'completed')        AS fatte,
    (SELECT count(*)::int FROM hospitality_crawl_queue WHERE status = 'failed')           AS fallite,
    (SELECT count(*)::int FROM hospitality_properties WHERE technology_status = 'detected')     AS rilevate,
    (SELECT count(*)::int FROM hospitality_properties WHERE technology_status = 'needs_review') AS da_verificare,
    (SELECT count(*)::int FROM hospitality_properties WHERE technology_status = 'unreachable')  AS irraggiungibili,
    (SELECT count(*)::int FROM hospitality_properties WHERE technology_status = 'no_website')   AS senza_sito,
    (SELECT count(*)::int FROM hospitality_properties WHERE technology_status = 'unknown')      AS non_rilevate,
    (SELECT count(*)::int FROM hospitality_unknown_booking_hosts WHERE NOT ignored)        AS host_sconosciuti;
