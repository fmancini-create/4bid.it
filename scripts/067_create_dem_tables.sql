-- Campagne DEM
CREATE TABLE IF NOT EXISTS dem_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Nuova campagna',
  subject TEXT NOT NULL DEFAULT '',
  html_template TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft', -- draft | sent
  sent_at TIMESTAMP WITH TIME ZONE,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Destinatari DEM (legati ad una campagna)
CREATE TABLE IF NOT EXISTS dem_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES dem_campaigns(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nome TEXT DEFAULT '',
  cognome TEXT DEFAULT '',
  nome_azienda TEXT DEFAULT '',
  send_status TEXT DEFAULT 'pending', -- pending | sent | failed
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS: solo service role
ALTER TABLE dem_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE dem_recipients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access dem_campaigns" ON dem_campaigns;
CREATE POLICY "Service role full access dem_campaigns" ON dem_campaigns FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access dem_recipients" ON dem_recipients;
CREATE POLICY "Service role full access dem_recipients" ON dem_recipients FOR ALL USING (true) WITH CHECK (true);

-- Indici
CREATE INDEX IF NOT EXISTS dem_recipients_campaign_id_idx ON dem_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS dem_campaigns_status_idx ON dem_campaigns(status);
