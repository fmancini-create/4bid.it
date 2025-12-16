-- Crea tabella per tracking giornaliero
CREATE TABLE IF NOT EXISTS landing_page_daily_stats (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  landing_page_id uuid REFERENCES landing_pages(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  views integer DEFAULT 0,
  conversions integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(landing_page_id, date)
);

-- Enable RLS
ALTER TABLE landing_page_daily_stats ENABLE ROW LEVEL SECURITY;

-- Policy per lettura autenticata
CREATE POLICY "Authenticated can view daily stats" ON landing_page_daily_stats
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy per scrittura autenticata
CREATE POLICY "Authenticated can insert daily stats" ON landing_page_daily_stats
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Funzione per salvare snapshot giornaliero
CREATE OR REPLACE FUNCTION save_daily_snapshot()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO landing_page_daily_stats (landing_page_id, date, views, conversions)
  SELECT id, CURRENT_DATE, views, conversions
  FROM landing_pages
  ON CONFLICT (landing_page_id, date)
  DO UPDATE SET views = EXCLUDED.views, conversions = EXCLUDED.conversions;
END;
$$;

-- Inserisci Homepage
INSERT INTO landing_pages (slug, title, description, category, published, views, conversions, launch_date)
VALUES ('', 'Homepage', 'Pagina principale 4BID.IT', 'homepage', true, 0, 0, '2025-12-15')
ON CONFLICT (slug) DO NOTHING;

-- Inserisci pagina Cos'è il Revenue Management
INSERT INTO landing_pages (slug, title, description, category, published, views, conversions, launch_date)
VALUES ('cose-il-revenue-management', 'Cos''è il Revenue Management', 'Guida completa al Revenue Management', 'servizi', true, 0, 0, '2025-12-15')
ON CONFLICT (slug) DO NOTHING;

-- Inserisci pagina Proponi la Tua Idea
INSERT INTO landing_pages (slug, title, description, category, published, views, conversions, launch_date)
VALUES ('proponi-idea', 'Proponi la Tua Idea', 'Proponi il tuo progetto a 4BID.IT', 'servizi', true, 0, 0, '2025-12-15')
ON CONFLICT (slug) DO NOTHING;

-- Inserisci Progetti
INSERT INTO landing_pages (slug, title, description, category, published, views, conversions, launch_date, project_name)
VALUES 
  ('progetti/santaddeo', 'SANTADDEO RMS', 'Software Revenue Management SANTADDEO', 'progetti', true, 0, 0, '2025-12-15', 'SANTADDEO'),
  ('progetti/manubot', 'MANUBOT', 'Progetto MANUBOT', 'progetti', true, 0, 0, '2025-12-15', 'MANUBOT'),
  ('progetti/risparmio-compulsivo', 'Risparmio Compulsivo', 'Progetto Risparmio Compulsivo', 'progetti', true, 0, 0, '2025-12-15', 'Risparmio Compulsivo'),
  ('progetti/autoexel', 'AutoExel', 'Progetto AutoExel', 'progetti', true, 0, 0, '2025-12-15', 'AutoExel')
ON CONFLICT (slug) DO NOTHING;
