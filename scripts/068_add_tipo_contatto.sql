-- Aggiunge il campo tipo_contatto alla tabella dem_recipients
-- Valori: cliente, ex_cliente, potenziale

ALTER TABLE dem_recipients
  ADD COLUMN IF NOT EXISTS tipo_contatto TEXT NOT NULL DEFAULT 'potenziale'
    CHECK (tipo_contatto IN ('cliente', 'ex_cliente', 'potenziale'));

-- Indice per filtrare per tipo
CREATE INDEX IF NOT EXISTS idx_dem_recipients_tipo ON dem_recipients(tipo_contatto);
