-- Tabella eventi di tracking per le DEM (open, click)
CREATE TABLE IF NOT EXISTS dem_tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES dem_campaigns(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES dem_recipients(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('open', 'click')),
  url TEXT,                     -- per eventi click: URL di destinazione
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aggiungi colonne di conteggio a dem_recipients per query veloci
ALTER TABLE dem_recipients
  ADD COLUMN IF NOT EXISTS open_count  INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS first_open_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS first_click_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_open_at   TIMESTAMPTZ;

-- Aggiungi contatori aggregati a dem_campaigns
ALTER TABLE dem_campaigns
  ADD COLUMN IF NOT EXISTS open_count     INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS click_count    INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unique_opens   INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unique_clicks  INTEGER DEFAULT 0;

-- RLS
ALTER TABLE dem_tracking_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access dem_tracking_events"
  ON dem_tracking_events FOR ALL USING (true);
