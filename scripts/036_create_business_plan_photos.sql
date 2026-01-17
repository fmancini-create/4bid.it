-- Crea tabella per le foto del business plan
CREATE TABLE IF NOT EXISTS business_plan_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_plan_id UUID REFERENCES business_plans(id) ON DELETE CASCADE,
  area TEXT NOT NULL CHECK (area IN ('building', 'rooms', 'common_areas', 'spa', 'restaurant', 'congress', 'garden')),
  photo_url TEXT NOT NULL,
  is_ai_generated BOOLEAN DEFAULT false,
  ai_prompt TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indice
CREATE INDEX IF NOT EXISTS idx_bp_photos_plan ON business_plan_photos(business_plan_id);

-- RLS
ALTER TABLE business_plan_photos ENABLE ROW LEVEL SECURITY;

-- Policy per service role
CREATE POLICY "Service role full access to business_plan_photos" 
ON business_plan_photos 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);
