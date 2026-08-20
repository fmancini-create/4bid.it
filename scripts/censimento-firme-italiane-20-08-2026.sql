-- Firme dei gestionali/motori di prenotazione italiani emersi dal censimento.
--
-- REGOLA CHE VIENE DA UN DIFETTO VERO, non da una preferenza di stile:
-- ogni pattern DEVE contenere il dominio del fornitore. La firma Beds24 aveva
-- `/(booking|booking2\.php)` -- una parola generica senza dominio -- e ha
-- attribuito a Beds24 sia Passepartout (un ALTRO gestionale italiano) sia una
-- semplice immagine chiamata `booking-banner-2024.jpg`. Una parola come
-- "booking" compare in mezzo mondo: non identifica nessuno.
--
-- Ogni dominio qui sotto e' PROVATO, non ricordato:
--   * 7 su 8 vengono dagli host realmente raccolti dal censimento in
--     produzione (tabella hospitality_unknown_booking_hosts), con l'URL della
--     pagina dove sono stati visti;
--   * Ericsoft non era fra gli host osservati: il suo dominio
--     (booking.ericsoft.com) viene dalla documentazione del fornitore. E'
--     l'unico non confermato da traffico nostro, ed e' segnato nelle note.

-- 1. Blastness -- visto su anticodoge.com come www.blastnessbooking.com
INSERT INTO hospitality_provider_signatures
  (slug, provider_name, technology_types, host_patterns, official_url, priority, notes)
VALUES
  ('blastness', 'Blastness', ARRAY['booking_engine'],
   ARRAY['(^|\.)blastnessbooking\.com$'],
   'https://www.blastness.it',
   95,
   'Host osservato dal censimento: www.blastnessbooking.com (su anticodoge.com).')
ON CONFLICT (slug) DO NOTHING;

-- 2. Passepartout -- visto su montecervinohotel.com come booking.passepartout.cloud.
--    E' il gestionale che la firma Beds24 troppo larga si attribuiva per errore.
INSERT INTO hospitality_provider_signatures
  (slug, provider_name, technology_types, host_patterns, official_url, priority, notes)
VALUES
  ('passepartout', 'Passepartout', ARRAY['booking_engine'],
   ARRAY['(^|\.)passepartout\.cloud$'],
   'https://www.passepartout.net',
   95,
   'Host osservato: booking.passepartout.cloud (su montecervinohotel.com). Era il falso positivo attribuito a Beds24.')
ON CONFLICT (slug) DO NOTHING;

-- 3. Booking Expert -- visto su hotelcolbricon.it come be.bookingexpert.it
INSERT INTO hospitality_provider_signatures
  (slug, provider_name, technology_types, host_patterns, official_url, priority, notes)
VALUES
  ('booking-expert', 'Booking Expert', ARRAY['booking_engine'],
   ARRAY['(^|\.)bookingexpert\.it$'],
   'https://www.bookingexpert.it',
   95,
   'Host osservato: be.bookingexpert.it (su hotelcolbricon.it).')
ON CONFLICT (slug) DO NOTHING;

-- 4. TravelClick -- visto su grandviscontipalace.com come reservations.travelclick.com
INSERT INTO hospitality_provider_signatures
  (slug, provider_name, technology_types, host_patterns, official_url, priority, notes)
VALUES
  ('travelclick', 'TravelClick', ARRAY['booking_engine'],
   ARRAY['(^|\.)travelclick\.com$'],
   'https://www.travelclick.com',
   95,
   'Host osservato: reservations.travelclick.com (su grandviscontipalace.com).')
ON CONFLICT (slug) DO NOTHING;

-- 5. GuestCare -- visto su hotelgarnisancarlo.com come booking.myguestcare.com
INSERT INTO hospitality_provider_signatures
  (slug, provider_name, technology_types, host_patterns, official_url, priority, notes)
VALUES
  ('guestcare', 'GuestCare', ARRAY['booking_engine'],
   ARRAY['(^|\.)myguestcare\.com$'],
   'https://www.guestcare.it',
   95,
   'Host osservato: booking.myguestcare.com (su hotelgarnisancarlo.com).')
ON CONFLICT (slug) DO NOTHING;

-- 6. Ermes Hotels -- visto su ilguelfobianco.it come book.ermeshotels.com.
--    NOTA: un albergo che usa il dominio di un ALTRO marchio per prenotare
--    indica un fornitore o un consorzio, non un dominio proprio.
INSERT INTO hospitality_provider_signatures
  (slug, provider_name, technology_types, host_patterns, official_url, priority, notes)
VALUES
  ('ermes-hotels', 'Ermes Hotels', ARRAY['booking_engine'],
   ARRAY['(^|\.)ermeshotels\.com$'],
   NULL,
   90,
   'Host osservato: book.ermeshotels.com (su ilguelfobianco.it). Da confermare se fornitore o consorzio.')
ON CONFLICT (slug) DO NOTHING;

-- 7. Ericsoft -- NON osservato dal nostro censimento. Dominio dalla
--    documentazione del fornitore: booking.ericsoft.com/BookingEngine/book.aspx
INSERT INTO hospitality_provider_signatures
  (slug, provider_name, technology_types, host_patterns, official_url, priority, notes)
VALUES
  ('ericsoft', 'Ericsoft', ARRAY['booking_engine'],
   ARRAY['(^|\.)ericsoft\.com$'],
   'https://www.ericsoft.com',
   95,
   'Dominio da documentazione fornitore (booking.ericsoft.com), NON ancora osservato nel nostro censimento.')
ON CONFLICT (slug) DO NOTHING;

-- 8. Octorate: NON un doppione. La firma esisteva gia' ma era
--    `^book\.octorate\.com$`, cioe' UN SOLO sottodominio esatto, e per questo
--    non ha riconosciuto `www.octorate.com` visto su domusarenaroma.com --
--    finito fra gli "sconosciuti" mentre il fornitore era in elenco.
--
--    Una firma troppo STRETTA non da' errori: tace. Ed e' il difetto opposto e
--    simmetrico a quello di Beds24: la stessa disattenzione (il pattern non
--    corrisponde a cio' che si incontra davvero) una volta fa rumore e una
--    volta fa silenzio.
UPDATE hospitality_provider_signatures
   SET host_patterns = ARRAY['(^|\.)octorate\.com$'],
       notes = 'Allargata il 20/08/2026: era ^book\.octorate\.com$ e non riconosceva www.octorate.com (visto su domusarenaroma.com).',
       updated_at = now()
 WHERE slug = 'octorate';
