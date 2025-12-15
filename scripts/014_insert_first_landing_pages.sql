-- Insert the first 2 landing pages created
INSERT INTO landing_pages (
  slug,
  title,
  description,
  category,
  project_name,
  meta_title,
  meta_description,
  meta_keywords,
  published,
  views,
  conversions
) VALUES
(
  'consulenza-revenue-management-hotel',
  'Consulenza Revenue Management Hotel',
  'Servizi di consulenza specializzata in revenue management per hotel e strutture ricettive',
  'revenue-management',
  'SANTADDEO',
  'Consulenza Revenue Management Hotel | 4BID.IT',
  'Servizi professionali di revenue management per hotel. Aumenta occupazione e ricavi con strategie di pricing dinamico e ottimizzazione OTA.',
  ARRAY['revenue management', 'consulenza hotel', 'pricing dinamico', 'ottimizzazione ricavi', 'revenue manager'],
  true,
  0,
  0
),
(
  'software-revenue-management-santaddeo',
  'Software Revenue Management SANTADDEO',
  'SANTADDEO: il software di revenue management trasparente per hotel che ottimizza prezzi e aumenta i ricavi',
  'revenue-management',
  'SANTADDEO',
  'SANTADDEO - Software Revenue Management Hotel | 4BID.IT',
  'Software revenue management 100% trasparente per hotel. Pricing dinamico, sincronizzazione OTA, analisi mercato. Prova gratuita 30 giorni.',
  ARRAY['santaddeo', 'software revenue management', 'rms hotel', 'gestionale hotel', 'pricing hotel'],
  true,
  0,
  0
)
ON CONFLICT (slug) DO NOTHING;
