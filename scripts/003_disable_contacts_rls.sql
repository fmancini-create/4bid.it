-- Disabilita completamente RLS per la tabella contacts
-- Questo permette inserimenti pubblici dalla contact form

-- Prima rimuoviamo tutte le policy esistenti
DROP POLICY IF EXISTS "Allow public insert" ON contacts;
DROP POLICY IF EXISTS "Allow authenticated read" ON contacts;
DROP POLICY IF EXISTS "Allow authenticated update" ON contacts;
DROP POLICY IF EXISTS "Allow authenticated delete" ON contacts;

-- Disabilitiamo RLS completamente per questa tabella
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;

-- Aggiungiamo un commento per chiarezza
COMMENT ON TABLE contacts IS 'Tabella contatti - RLS disabilitato per permettere inserimenti pubblici';
