-- Aggiungi operatore admin per Villa I Barronci
-- Email: f.mancini@ibarronci.com
-- Password: Pippolo75@

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
  crypt('Pippolo75@', gen_salt('bf')),
  'admin',
  true
FROM ecomobility_structures 
WHERE slug = 'villa-i-barronci'
ON CONFLICT (email) DO UPDATE SET
  password_hash = crypt('Pippolo75@', gen_salt('bf')),
  role = 'admin',
  is_active = true,
  updated_at = NOW();
