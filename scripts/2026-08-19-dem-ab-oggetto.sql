-- Prova A/B sull'oggetto delle DEM.
--
-- Due colonne, nessuna tabella nuova: la prova riguarda un attributo della
-- campagna (il secondo oggetto) e un attributo del singolo invio (quale dei due
-- e' realmente partito).
--
-- Tutto e' additivo e annullabile: le campagne esistenti restano con
-- `subject_b` a NULL, cioe' "nessuna prova", e continuano a spedire l'unico
-- oggetto esattamente come prima.

-- Secondo oggetto della prova. NULL = nessuna prova in corso.
ALTER TABLE dem_campaigns
  ADD COLUMN IF NOT EXISTS subject_b text;

COMMENT ON COLUMN dem_campaigns.subject_b IS
  'Secondo oggetto della prova A/B. NULL o uguale a subject = nessuna prova: si spedisce solo subject.';

-- Variante realmente spedita al singolo destinatario.
--
-- NULL e' un valore CON SIGNIFICATO: "spedita fuori dalla prova". Le email
-- partite prima che la prova iniziasse hanno NULL e vanno ESCLUSE dal confronto:
-- contarle come A sommerebbe invii fatti in giorni diversi, con reputazione del
-- mittente diversa, e attribuirebbe all'oggetto una differenza che non e' sua.
ALTER TABLE dem_recipients
  ADD COLUMN IF NOT EXISTS subject_variant text;

COMMENT ON COLUMN dem_recipients.subject_variant IS
  'Variante di oggetto spedita: A, B, oppure NULL se inviata fuori dalla prova A/B (da escludere dal confronto).';

-- Il vincolo ammette esplicitamente NULL: senza questa clausola le righe
-- storiche (tutte NULL) violerebbero il vincolo e l'ALTER TABLE fallirebbe.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'dem_recipients_subject_variant_check'
  ) THEN
    ALTER TABLE dem_recipients
      ADD CONSTRAINT dem_recipients_subject_variant_check
      CHECK (subject_variant IS NULL OR subject_variant IN ('A', 'B'));
  END IF;
END $$;

-- Indice parziale: il confronto legge SOLO le righe che appartengono alla prova
-- (variante non nulla), che sono una minoranza delle righe della tabella.
-- Un indice pieno occuperebbe spazio per milioni di NULL mai interrogati.
CREATE INDEX IF NOT EXISTS dem_recipients_ab_idx
  ON dem_recipients (campaign_id, subject_variant)
  WHERE subject_variant IS NOT NULL;
