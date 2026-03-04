-- Aggiungi operatore admin per Villa I Barronci
-- Email: f.mancini@ibarronci.com
-- Password: set via environment variable

-- Prima aggiungi la colonna password_hash se non esiste
ALTER TABLE ecomobility_operators 
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Poi aggiungi la colonna updated_at se non esiste
ALTER TABLE ecomobility_operators 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Prima elimina l'operatore esistente con questa email (per evitare conflitti unique)
DELETE FROM ecomobility_operators WHERE email = 'f.mancini@ibarronci.com';

-- Inserisci il nuovo operatore admin
INSERT INTO ecomobility_operators (
  structure_id,
  name,
  email,
  password_hash,
  role,
  is_active
)
SELECT 
  id,
  'Francesco Mancini',
  'f.mancini@ibarronci.com',
  crypt('CHANGE_ME', gen_salt('bf')),
  'admin',
  true
FROM ecomobility_structures 
WHERE slug = 'villa-i-barronci';
