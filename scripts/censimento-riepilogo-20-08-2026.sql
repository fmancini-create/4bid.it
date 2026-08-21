-- Riepilogo del censimento per la pagina /admin/censimento-strutture.
--
-- Esiste per un motivo preciso: la pagina mostra conteggi per gestionale, e un
-- conteggio senza la copertura e' FUORVIANTE. Oggi sono esaminate 31 strutture
-- su ~17.900 con sito: "Blastness 2" non significa "in Italia ci sono 2 alberghi
-- Blastness", significa "2 fra le 31 che abbiamo guardato". Chi legge deve
-- vedere le due cose insieme, sempre.

CREATE OR REPLACE FUNCTION censimento_riepilogo()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH copertura AS (
    SELECT
      count(*)::int AS totali,
      -- Chi non ha un sito non potra' MAI essere esaminato: tenerlo nel
      -- denominatore farebbe sembrare il censimento piu' indietro di quanto sia.
      count(*) FILTER (WHERE technology_status = 'no_website')::int AS senza_sito,
      count(*) FILTER (WHERE technology_status <> 'no_website')::int AS esaminabili,
      -- "Esaminata" = l'abbiamo davvero guardata, non "ha dato un risultato".
      count(*) FILTER (WHERE last_crawled_at IS NOT NULL)::int AS esaminate,
      count(*) FILTER (WHERE technology_status = 'detected')::int AS con_gestionale,
      count(*) FILTER (WHERE technology_status = 'unreachable')::int AS irraggiungibili
    FROM hospitality_properties
  ),
  per_fornitore AS (
    SELECT
      d.provider_name,
      d.technology_type,
      count(DISTINCT d.property_id)::int AS strutture
    FROM hospitality_technology_detections d
    WHERE d.is_current
    GROUP BY d.provider_name, d.technology_type
    ORDER BY count(DISTINCT d.property_id) DESC, d.provider_name
  ),
  -- Gli host di prenotazione ancora senza firma: sono i concorrenti che NON
  -- stiamo vedendo, e vanno mostrati accanto ai conteggi. Un elenco di
  -- gestionali che tace su cio' che non riconosce si legge come completo.
  da_riconoscere AS (
    SELECT count(*)::int AS n
    FROM hospitality_unknown_booking_hosts
    WHERE NOT ignored
  )
  SELECT jsonb_build_object(
    'copertura', (
      SELECT jsonb_build_object(
        'totali', totali,
        'senza_sito', senza_sito,
        'esaminabili', esaminabili,
        'esaminate', esaminate,
        'con_gestionale', con_gestionale,
        'irraggiungibili', irraggiungibili,
        'da_esaminare', greatest(esaminabili - esaminate, 0)
      )
      FROM copertura
    ),
    'fornitori', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'provider_name', provider_name,
        'technology_type', technology_type,
        'strutture', strutture
      ))
      FROM per_fornitore
    ), '[]'::jsonb),
    'host_da_riconoscere', (SELECT n FROM da_riconoscere)
  );
$$;
