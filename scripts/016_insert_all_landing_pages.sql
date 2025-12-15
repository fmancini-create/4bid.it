-- Insert all 6 landing pages into the database with proper tracking setup

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
-- Revenue Management Pages
(
  'consulenza-revenue-management-hotel',
  'Consulenza Revenue Management Hotel',
  'Servizio di consulenza Revenue Management per aumentare ricavi hotel con pricing dinamico',
  'revenue-management',
  NULL,
  'Consulenza Revenue Management Hotel | 4BID.IT',
  'Servizio di consulenza Revenue Management per hotel, resort e strutture ricettive. Aumenta i ricavi del tuo hotel con strategie di pricing dinamico e ottimizzazione tariffe.',
  ARRAY['consulenza revenue management', 'revenue manager hotel', 'consulenza alberghiera', 'pricing hotel', 'ottimizzazione tariffe hotel'],
  true,
  0,
  0
),
(
  'software-revenue-management-santaddeo',
  'SANTADDEO - Software Revenue Management AI',
  'Software di Revenue Management con AI trasparente per hotel',
  'revenue-management',
  'SANTADDEO',
  'SANTADDEO - Software Revenue Management Hotel AI | 4BID.IT',
  'SANTADDEO: il primo software di Revenue Management con AI trasparente che spiega ogni decisione di pricing. Sistema intelligente per hotel che combina algoritmi avanzati e logica umana.',
  ARRAY['software revenue management', 'RMS hotel', 'revenue management AI', 'pricing dinamico hotel', 'SANTADDEO'],
  true,
  0,
  0
),
(
  'ottimizzazione-prezzi-hotel-toscana',
  'Ottimizzazione Prezzi Hotel in Toscana',
  'Revenue Management specializzato per hotel in Toscana con conoscenza del mercato locale',
  'revenue-management',
  NULL,
  'Ottimizzazione Prezzi Hotel in Toscana | Revenue Management',
  'Servizio specializzato di ottimizzazione prezzi per hotel in Toscana. Aumenta RevPAR e ADR con strategie di pricing dinamico personalizzate per il mercato toscano.',
  ARRAY['ottimizzazione prezzi hotel toscana', 'revenue management toscana', 'hotel firenze prezzi', 'pricing dinamico toscana'],
  true,
  0,
  0
),
(
  'revenue-management-bed-and-breakfast',
  'Revenue Management per Bed & Breakfast',
  'Soluzioni di Revenue Management pensate per B&B e piccole strutture familiari',
  'revenue-management',
  NULL,
  'Revenue Management per Bed & Breakfast | Ottimizza i Tuoi Ricavi',
  'Servizio specializzato di Revenue Management per B&B e piccole strutture ricettive. Aumenta occupazione e tariffe medie con strategie dedicate alle strutture familiari.',
  ARRAY['revenue management bed and breakfast', 'revenue management b&b', 'pricing bed and breakfast', 'occupazione b&b'],
  true,
  0,
  0
),
(
  'revenue-management-agriturismi',
  'Revenue Management per Agriturismi',
  'Strategie su misura per il turismo rurale e agriturismi',
  'revenue-management',
  NULL,
  'Revenue Management per Agriturismi | Ottimizza Prezzi e Occupazione | 4BID.IT',
  'Servizi specializzati di revenue management per agriturismi. Aumenta occupazione e ricavi con strategie personalizzate per il turismo rurale ed enogastronomico.',
  ARRAY['revenue management agriturismi', 'prezzi agriturismi', 'occupazione agriturismo', 'turismo rurale'],
  true,
  0,
  0
),
(
  'dynamic-pricing-hotel',
  'Dynamic Pricing Automatizzato per Hotel',
  'Sistema di pricing dinamico automatico che ottimizza tariffe in tempo reale',
  'revenue-management',
  NULL,
  'Dynamic Pricing per Hotel | Prezzi Dinamici Automatizzati | 4BID.IT',
  'Sistema di dynamic pricing per hotel che ottimizza automaticamente le tariffe in tempo reale. Aumenta revenue fino al 30% con algoritmi avanzati di pricing dinamico.',
  ARRAY['dynamic pricing hotel', 'prezzi dinamici hotel', 'pricing automatico hotel', 'revenue management automatizzato'],
  true,
  0,
  0
)
ON CONFLICT (slug) DO NOTHING;
