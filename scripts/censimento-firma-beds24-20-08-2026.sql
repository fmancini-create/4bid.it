-- Correzione della firma Beds24: un pattern che era una PAROLA GENERICA.
--
-- Prima:  url_patterns = ['/(booking|booking2\.php)']
--
-- `/booking` combacia con QUALSIASI percorso che contenga la parola, su
-- QUALSIASI sito. Non identificava Beds24: identificava la parola "booking".
-- Misurato su 40 siti reali, aveva attribuito a Beds24:
--   * https://booking.passepartout.cloud/booking?oidPortale=20609
--     -> e' Passepartout, un PMS italiano CONCORRENTE, non Beds24
--   * https://villailtrebbio.it/assets/img/booking-banner-2024.jpg
--     -> e' un'IMMAGINE sul sito dell'albergo stesso
--
-- Dopo:   url_patterns = ['beds24\.com/booking2?']
--
-- La prova di Beds24 e' il suo dominio, che e' GIA' in host_patterns
-- ('(^|\.)beds24\.com$'). Il pattern di URL serve solo per gli indirizzi
-- incorporati che l'estrazione degli host non intercetta, e deve quindi
-- portare il dominio con se'.
--
-- Cosa si perde: un Beds24 white-label servito interamente dal dominio
-- dell'albergo non verra' piu' rilevato. E' una perdita ACCETTATA: la struttura
-- resta 'unknown' (nessuna affermazione), mentre prima veniva assegnata al
-- fornitore sbagliato. In una DEM filtrata per gestionale, scrivere a un
-- cliente Passepartout parlandogli di Beds24 e' un danno commerciale; non
-- scrivergli affatto e' solo un'occasione mancata.

UPDATE hospitality_provider_signatures
   SET url_patterns = ARRAY['beds24\.com/booking2?'],
       updated_at   = now()
 WHERE slug = 'beds24';
