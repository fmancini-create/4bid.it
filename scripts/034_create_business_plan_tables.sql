-- Tabella principale business_plans
CREATE TABLE IF NOT EXISTS business_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  client_name TEXT,
  project_type TEXT DEFAULT 'hotel', -- hotel, restaurant, other
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  
  -- Parametri strutturali
  num_rooms INTEGER DEFAULT 90,
  stars INTEGER DEFAULT 4,
  has_spa BOOLEAN DEFAULT true,
  has_restaurant BOOLEAN DEFAULT true,
  location TEXT,
  
  -- Parametri temporali
  opening_days_year INTEGER DEFAULT 365,
  projection_years INTEGER DEFAULT 3,
  start_year INTEGER DEFAULT 2026,
  
  -- Contenuto testuale
  executive_summary TEXT,
  market_analysis TEXT,
  business_model TEXT,
  marketing_strategy TEXT,
  management_team TEXT,
  risk_analysis TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Tabella parametri finanziari per anno
CREATE TABLE IF NOT EXISTS business_plan_financials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_plan_id UUID REFERENCES business_plans(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  
  -- RICAVI - Parametri Room Division
  occupancy_rate DECIMAL(5,2) DEFAULT 65.00, -- percentuale occupazione
  adr DECIMAL(10,2) DEFAULT 180.00, -- Average Daily Rate (ricavo medio camera)
  
  -- RICAVI - Parametri F&B (Food & Beverage)
  fb_revenue_per_room_night DECIMAL(10,2) DEFAULT 45.00, -- ricavo F&B per camera occupata
  fb_external_covers_day INTEGER DEFAULT 30, -- coperti esterni giornalieri
  fb_avg_ticket_external DECIMAL(10,2) DEFAULT 55.00, -- scontrino medio esterno
  
  -- RICAVI - Parametri SPA/Wellness
  spa_revenue_per_room_night DECIMAL(10,2) DEFAULT 25.00, -- ricavo spa per camera occupata
  spa_external_clients_day INTEGER DEFAULT 10, -- clienti esterni spa giornalieri
  spa_avg_ticket_external DECIMAL(10,2) DEFAULT 80.00, -- scontrino medio spa esterno
  
  -- RICAVI - Altri
  other_revenue_per_room_night DECIMAL(10,2) DEFAULT 10.00, -- parcheggio, minibar, etc.
  
  -- COSTI VARIABILI (percentuali sui ricavi)
  room_cost_pct DECIMAL(5,2) DEFAULT 15.00, -- costo variabile camere (pulizia, amenities, lavanderia)
  fb_cost_pct DECIMAL(5,2) DEFAULT 35.00, -- food cost + beverage cost
  spa_cost_pct DECIMAL(5,2) DEFAULT 25.00, -- costo variabile spa (prodotti, terapisti esterni)
  
  -- COSTI FISSI MENSILI
  staff_cost_monthly DECIMAL(12,2) DEFAULT 85000.00, -- personale
  rent_cost_monthly DECIMAL(12,2) DEFAULT 25000.00, -- affitto/leasing
  utilities_cost_monthly DECIMAL(12,2) DEFAULT 18000.00, -- utenze (luce, gas, acqua)
  maintenance_cost_monthly DECIMAL(12,2) DEFAULT 8000.00, -- manutenzione ordinaria
  insurance_cost_monthly DECIMAL(12,2) DEFAULT 5000.00, -- assicurazioni
  marketing_cost_monthly DECIMAL(12,2) DEFAULT 12000.00, -- marketing e commerciale
  admin_cost_monthly DECIMAL(12,2) DEFAULT 6000.00, -- amministrazione e consulenze
  ota_commission_pct DECIMAL(5,2) DEFAULT 18.00, -- commissioni OTA (su % ricavi room)
  ota_share_pct DECIMAL(5,2) DEFAULT 40.00, -- % prenotazioni via OTA
  other_fixed_monthly DECIMAL(12,2) DEFAULT 5000.00, -- altri costi fissi
  
  -- INVESTIMENTI E AMMORTAMENTI
  initial_investment DECIMAL(14,2) DEFAULT 8000000.00, -- investimento iniziale
  depreciation_years INTEGER DEFAULT 20, -- anni ammortamento
  
  -- FINANZIAMENTO
  loan_amount DECIMAL(14,2) DEFAULT 5000000.00, -- importo finanziamento
  loan_interest_rate DECIMAL(5,2) DEFAULT 4.50, -- tasso interesse annuo
  loan_years INTEGER DEFAULT 15, -- durata finanziamento
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(business_plan_id, year)
);

-- Tabella condivisioni business plan
CREATE TABLE IF NOT EXISTS business_plan_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_plan_id UUID REFERENCES business_plans(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL, -- password hashata per accesso
  access_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  
  -- Permessi
  can_edit BOOLEAN DEFAULT false,
  can_download BOOLEAN DEFAULT true,
  
  -- Tracking
  expires_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ,
  access_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  UNIQUE(business_plan_id, email)
);

-- Tabella note/commenti sul business plan
CREATE TABLE IF NOT EXISTS business_plan_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_plan_id UUID REFERENCES business_plans(id) ON DELETE CASCADE,
  section TEXT, -- executive_summary, financials, etc.
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT -- email o 'admin'
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_bp_financials_plan ON business_plan_financials(business_plan_id);
CREATE INDEX IF NOT EXISTS idx_bp_shares_token ON business_plan_shares(access_token);
CREATE INDEX IF NOT EXISTS idx_bp_shares_email ON business_plan_shares(email);
CREATE INDEX IF NOT EXISTS idx_bp_notes_plan ON business_plan_notes(business_plan_id);

-- RLS Policies
ALTER TABLE business_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_plan_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_plan_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_plan_notes ENABLE ROW LEVEL SECURITY;

-- Policy per admin (service role bypassa RLS)
CREATE POLICY "Admin full access to business_plans" ON business_plans FOR ALL USING (true);
CREATE POLICY "Admin full access to business_plan_financials" ON business_plan_financials FOR ALL USING (true);
CREATE POLICY "Admin full access to business_plan_shares" ON business_plan_shares FOR ALL USING (true);
CREATE POLICY "Admin full access to business_plan_notes" ON business_plan_notes FOR ALL USING (true);

-- Funzione per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_business_plan_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger per updated_at
DROP TRIGGER IF EXISTS update_business_plans_timestamp ON business_plans;
CREATE TRIGGER update_business_plans_timestamp
  BEFORE UPDATE ON business_plans
  FOR EACH ROW EXECUTE FUNCTION update_business_plan_timestamp();

DROP TRIGGER IF EXISTS update_business_plan_financials_timestamp ON business_plan_financials;
CREATE TRIGGER update_business_plan_financials_timestamp
  BEFORE UPDATE ON business_plan_financials
  FOR EACH ROW EXECUTE FUNCTION update_business_plan_timestamp();
