-- Aggiunge il campo tipo_contatto a dem_recipients
ALTER TABLE dem_recipients
  ADD COLUMN IF NOT EXISTS tipo_contatto TEXT NOT NULL DEFAULT 'cliente'
  CHECK (tipo_contatto IN ('cliente', 'ex_cliente', 'potenziale'));

-- Indice per filtrare per tipo
CREATE INDEX IF NOT EXISTS dem_recipients_tipo_contatto_idx ON dem_recipients(tipo_contatto);
