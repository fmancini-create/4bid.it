-- Add homepage, proponi-idea and 4 project pages to landing_pages table
-- These pages were missing tracking in the database

-- Homepage
INSERT INTO landing_pages (slug, title, category, launch_date, published)
VALUES ('', 'Homepage 4BID.IT', 'homepage', '2025-12-15', true)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  launch_date = EXCLUDED.launch_date,
  published = EXCLUDED.published;

-- Proponi Idea page
INSERT INTO landing_pages (slug, title, category, launch_date, published)
VALUES ('proponi-idea', 'Proponi la Tua Idea', 'servizi', '2025-12-15', true)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  launch_date = EXCLUDED.launch_date,
  published = EXCLUDED.published;

-- Project pages
INSERT INTO landing_pages (slug, title, category, project_name, launch_date, published)
VALUES 
  ('progetti/santaddeo', 'SANTADDEO - The Human Revenue Manager', 'progetti', 'SANTADDEO', '2025-12-15', true),
  ('progetti/autoexel', 'AutoExel - Excel senza formule', 'progetti', 'AutoExel', '2025-12-15', true),
  ('progetti/manubot', 'ManuBot - Smart Maintenance Assistant', 'progetti', 'ManuBot', '2025-12-15', true),
  ('progetti/risparmio-compulsivo', 'Risparmio Compulsivo - Save Play Win', 'progetti', 'Risparmio Compulsivo', '2025-12-15', true)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  project_name = EXCLUDED.project_name,
  launch_date = EXCLUDED.launch_date,
  published = EXCLUDED.published;
