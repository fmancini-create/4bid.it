-- Censimento gestionali: togliere dall'elenco "da valutare" gli host che ORMAI
-- hanno una firma.
--
-- Il difetto, visto con gli occhi dopo aver aggiunto le 8 firme italiane:
-- `be.bookingexpert.it`, `book.ermeshotels.com`, `booking.myguestcare.com`,
-- `booking.passepartout.cloud`, `reservations.travelclick.com`,
-- `www.blastnessbooking.com` e `www.octorate.com` erano ancora nell'elenco degli
-- host SCONOSCIUTI, pur essendo appena diventati fornitori riconosciuti.
--
-- Un elenco di "cose da valutare" che contiene cose GIA' valutate fa perdere
-- tempo a chi lo legge, e a ogni firma aggiunta il rumore cresce. E' un difetto
-- che si aggrava da solo.
--
-- Si MARCA `ignored`, non si CANCELLA: `first_seen_at` e il numero di
-- occorrenze sono la storia di quando e quanto abbiamo incontrato quel
-- fornitore prima di riconoscerlo, e serve a decidere le priorita' future.
-- Cancellare butterebbe una misura che non si puo' rifare.

CREATE OR REPLACE FUNCTION censimento_ripulisci_host_coperti()
RETURNS TABLE(host_marcati int, host_residui int)
LANGUAGE plpgsql
AS $$
DECLARE
  v_marcati int;
BEGIN
  -- Un host esce dall'elenco se combacia con `host_patterns` di QUALSIASI firma
  -- attiva. Si guardano solo gli `host_patterns` e non gli `url_patterns`,
  -- perche' qui la colonna contiene un host: confrontarlo con un pattern di
  -- percorso sarebbe un confronto fra cose diverse.
  -- Si registra QUALE fornitore lo copre, non solo che e' stato messo da parte:
  -- senza il nome, fra sei mesi nessuno sapra' se un host e' fuori dall'elenco
  -- perche' riconosciuto o perche' scartato come rumore. Sono due cose molto
  -- diverse, e `classified_provider` esiste esattamente per questo.
  WITH coperti AS (
    SELECT DISTINCT ON (u.host) u.host, s.provider_name
    FROM hospitality_unknown_booking_hosts u
    JOIN hospitality_provider_signatures s ON s.enabled
    JOIN LATERAL unnest(s.host_patterns) AS p ON u.host ~* p
    WHERE NOT u.ignored
    -- A parita' di combaciamento vince la firma a priorita' piu' alta, la stessa
    -- regola che usa il riconoscimento: due parti che decidono in modo diverso
    -- direbbero due nomi diversi per lo stesso host.
    ORDER BY u.host, s.priority DESC, s.slug
  )
  UPDATE hospitality_unknown_booking_hosts u
  SET ignored = true,
      classified_provider = c.provider_name
  FROM coperti c
  WHERE u.host = c.host;

  GET DIAGNOSTICS v_marcati = ROW_COUNT;

  RETURN QUERY
  SELECT v_marcati,
         (SELECT count(*)::int FROM hospitality_unknown_booking_hosts WHERE NOT ignored);
END;
$$;

COMMENT ON FUNCTION censimento_ripulisci_host_coperti() IS
  'Marca ignored gli host di prenotazione che ora combaciano con una firma attiva. Da lanciare dopo ogni aggiunta di firme: senza, l''elenco dei fornitori da valutare accumula rumore che cresce a ogni firma.';
