-- Freno automatico sui rimbalzi per le campagne DEM.
--
-- Perche' serve: il 29/06/2026 sono partite 3.291 email con il 31,2% di rimbalzi
-- (1.026 indirizzi inesistenti, sparsi su 561 domini diversi) e NULLA ha fermato
-- l'invio, perche' un freno non esisteva. Un tasso di rimbalzo alto e' il modo
-- piu' rapido per essere marcati come spammer: il danno colpirebbe anche le email
-- di servizio ai clienti (Santaddeo, fatture), non solo le campagne.
--
-- Questa colonna rende VISIBILE il motivo della sospensione. Senza di essa
-- l'invio si fermerebbe in silenzio e sembrerebbe un guasto del sistema, non una
-- protezione che ha funzionato.
--
-- Additiva e nullable: nessuna query esistente cambia comportamento.

alter table public.dem_campaigns
  add column if not exists auto_paused_reason text;

comment on column public.dem_campaigns.auto_paused_reason is
  'Motivo leggibile per cui l''invio automatico e'' stato sospeso (es. tasso di rimbalzo oltre soglia). NULL = nessuna sospensione automatica.';
