-- Tracking avanzato delle condivisioni Business Plan / preventivi pubblici
-- Eseguire su Supabase prima del deploy della feature.

ALTER TABLE business_plan_shares
  ADD COLUMN IF NOT EXISTS email_opened_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS email_open_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS first_viewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS forwarded_by_share_id UUID REFERENCES business_plan_shares(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS business_plan_share_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id UUID NOT NULL REFERENCES business_plan_shares(id) ON DELETE CASCADE,
  business_plan_id UUID NOT NULL REFERENCES business_plans(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('email_sent', 'email_opened', 'page_viewed', 'forwarded')),
  recipient_email TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bp_share_events_share ON business_plan_share_events(share_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bp_share_events_plan ON business_plan_share_events(business_plan_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bp_share_events_type ON business_plan_share_events(event_type, created_at DESC);

ALTER TABLE business_plan_share_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access to business_plan_share_events" ON business_plan_share_events;
CREATE POLICY "Admin full access to business_plan_share_events"
  ON business_plan_share_events FOR ALL USING (true);
