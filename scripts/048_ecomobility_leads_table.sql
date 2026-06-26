-- =====================================================
-- 4BID ECOMOBILITY - LEADS TABLE
-- Per gestire le richieste di demo dalle strutture
-- =====================================================

CREATE TABLE IF NOT EXISTS ecomobility_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  structure_name TEXT NOT NULL,
  structure_type TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT NOT NULL,
  province TEXT NOT NULL,
  vehicle_count TEXT,
  message TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'demo_scheduled', 'negotiating', 'won', 'lost')),
  source TEXT DEFAULT 'website',
  notes TEXT,
  assigned_to TEXT,
  contacted_at TIMESTAMPTZ,
  demo_date TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  converted_structure_id UUID REFERENCES ecomobility_structures(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_eco_leads_status ON ecomobility_leads(status);
CREATE INDEX IF NOT EXISTS idx_eco_leads_email ON ecomobility_leads(email);
CREATE INDEX IF NOT EXISTS idx_eco_leads_created ON ecomobility_leads(created_at DESC);

-- RLS
ALTER TABLE ecomobility_leads ENABLE ROW LEVEL SECURITY;

-- Policy
CREATE POLICY "Service role full access ecomobility_leads" 
  ON ecomobility_leads FOR ALL TO service_role 
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access ecomobility_leads" 
  ON ecomobility_leads FOR ALL TO authenticated 
  USING (true) WITH CHECK (true);

COMMENT ON TABLE ecomobility_leads IS 'Lead di strutture interessate a Ecomobility raccolte dal form di registrazione';
