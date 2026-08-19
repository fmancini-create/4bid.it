-- Conserva l'oggetto con cui una campagna ha spedito PRIMA di una prova A/B.
--
-- PERCHE': la prova A/B fra due oggetti nuovi richiede di riscrivere
-- `dem_campaigns.subject`. Ma quella colonna e' l'UNICA traccia di cosa hanno
-- ricevuto i destinatari gia' spediti: sulla campagna Air Market sono 4.119
-- email con l'oggetto "Il tuo prossimo ospite ha già prenotato il volo", che
-- ha aperto al 15,15%. Sovrascrivendola, quel 15,15% resterebbe attaccato a un
-- oggetto che non risulta piu' da nessuna parte: un numero senza l'etichetta di
-- cosa misurava non e' un dato, e' un numero orfano.
--
-- Le email gia' partite hanno `subject_variant = NULL` e restano fuori dal
-- confronto A/B (e' corretto: spedite in giorni diversi, con un corpo diverso).
-- Questa colonna serve a poter comunque dire QUALE oggetto avevano.
--
-- Additiva: nessuna riga esistente viene modificata, nessuna colonna rimossa.

alter table dem_campaigns
  add column if not exists subject_legacy text;

comment on column dem_campaigns.subject_legacy is
  'Oggetto usato prima dell''avvio di una prova A/B, conservato per poter attribuire le aperture dei destinatari spediti in precedenza (quelli con subject_variant NULL). Sola lettura: non viene mai usato per spedire.';
