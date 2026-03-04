-- Drop old constraint and add new one with 'rappresentante' value
ALTER TABLE dem_recipients DROP CONSTRAINT dem_recipients_tipo_contatto_check;
ALTER TABLE dem_recipients ALTER COLUMN tipo_contatto DROP NOT NULL;
ALTER TABLE dem_recipients ADD CONSTRAINT dem_recipients_tipo_contatto_check 
  CHECK (tipo_contatto IS NULL OR tipo_contatto = ANY (ARRAY['cliente', 'ex_cliente', 'potenziale', 'rappresentante']));
