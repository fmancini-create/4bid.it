-- Crea tabella commenti per business plan condivisi

CREATE TABLE IF NOT EXISTS business_plan_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id UUID REFERENCES business_plan_shares(id) ON DELETE CASCADE,
  business_plan_id UUID REFERENCES business_plans(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_bp_comments_share ON business_plan_comments(share_id);
CREATE INDEX IF NOT EXISTS idx_bp_comments_plan ON business_plan_comments(business_plan_id);

-- RLS
ALTER TABLE business_plan_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access to business_plan_comments" ON business_plan_comments FOR ALL USING (true);
