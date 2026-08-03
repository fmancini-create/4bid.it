-- Freno sui rimbalzi anche per i RICHIAMI (solleciti caldi).
--
-- Perche': il freno del 01/08 vive nel cron freddo (`dem-auto-send`) e
-- nell'invio manuale (`/api/dem/send`), ma il cron `dem-warm-send` e' un TERZO
-- percorso: crea campagne FIGLIE con un proprio id e le invia, quindi la
-- sospensione della campagna madre non le fermava.
--
-- `dem_followups.status` ammette gia' 'paused' (nessun CHECK, e la pagina ha
-- badge "In pausa" + pulsante "Riprendi"), quindi non serve un nuovo stato:
-- serve il MOTIVO. Senza, la sequenza risulterebbe solo "in pausa" e il
-- pulsante verde invoglierebbe a riprendere senza sapere che i rimbalzi
-- ripartono - lo stesso difetto muto gia' corretto sulle campagne.
ALTER TABLE public.dem_followups
  ADD COLUMN IF NOT EXISTS paused_reason text;

COMMENT ON COLUMN public.dem_followups.paused_reason IS
  'Motivo della pausa automatica per rimbalzi troppo alti. NULL = nessuna pausa automatica. Azzerato quando si riprende la sequenza.';
