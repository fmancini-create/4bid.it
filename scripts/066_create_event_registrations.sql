-- Create event_registrations table for Santaddeo launch event
CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_slug TEXT NOT NULL DEFAULT 'santaddeo-launch-2026',
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company_name TEXT,
  role TEXT,
  num_guests INTEGER DEFAULT 1,
  brings_device BOOLEAN DEFAULT false,
  dietary_notes TEXT,
  notes TEXT,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'waitlist')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint: one registration per email per event
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_registrations_email_event 
  ON event_registrations(email, event_slug);

-- Index for querying by event
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_slug 
  ON event_registrations(event_slug);

-- Enable RLS
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- Policy: service role has full access (admin)
CREATE POLICY "Service role full access event_registrations" 
  ON event_registrations FOR ALL 
  USING (true) WITH CHECK (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_event_registrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_event_registrations_updated_at
  BEFORE UPDATE ON event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_event_registrations_updated_at();
