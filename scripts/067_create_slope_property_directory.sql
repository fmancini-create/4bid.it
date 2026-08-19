-- Archivio privato delle strutture che usano il booking engine Slope.
-- Gli URL Slope contengono UUID non progressivi: la scansione usa una coda
-- alimentabile dal superadmin e aggiornata automaticamente dal cron.

CREATE TABLE IF NOT EXISTS public.slope_properties (
  slope_id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  emails TEXT[] NOT NULL DEFAULT '{}',
  pec TEXT,
  phone TEXT,
  phones TEXT[] NOT NULL DEFAULT '{}',
  website_url TEXT,
  booking_url TEXT NOT NULL,
  address TEXT,
  postal_code TEXT,
  city TEXT,
  province TEXT,
  region TEXT,
  country TEXT,
  facebook_url TEXT,
  instagram_url TEXT,
  whatsapp_url TEXT,
  logo_url TEXT,
  vat_number TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  source_title TEXT,
  source_http_status INTEGER,
  data_quality SMALLINT NOT NULL DEFAULT 0 CHECK (data_quality BETWEEN 0 AND 100),
  contact_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  first_detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  search_text TEXT GENERATED ALWAYS AS (
    LOWER(
      COALESCE(name, '') || ' ' ||
      COALESCE(email, '') || ' ' ||
      COALESCE(pec, '') || ' ' ||
      COALESCE(phone, '') || ' ' ||
      COALESCE(website_url, '') || ' ' ||
      COALESCE(address, '') || ' ' ||
      COALESCE(postal_code, '') || ' ' ||
      COALESCE(city, '') || ' ' ||
      COALESCE(province, '') || ' ' ||
      COALESCE(region, '') || ' ' ||
      COALESCE(country, '') || ' ' ||
      COALESCE(vat_number, '') || ' ' ||
      slope_id::TEXT
    )
  ) STORED
);

CREATE INDEX IF NOT EXISTS idx_slope_properties_name ON public.slope_properties (name);
CREATE INDEX IF NOT EXISTS idx_slope_properties_city ON public.slope_properties (city);
CREATE INDEX IF NOT EXISTS idx_slope_properties_region ON public.slope_properties (region);
CREATE INDEX IF NOT EXISTS idx_slope_properties_active_name ON public.slope_properties (is_active, name);
CREATE INDEX IF NOT EXISTS idx_slope_properties_last_checked ON public.slope_properties (last_checked_at DESC);

ALTER TABLE public.slope_properties ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.slope_properties FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.slope_properties TO service_role;

CREATE TABLE IF NOT EXISTS public.slope_scan_queue (
  slope_id UUID PRIMARY KEY,
  booking_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  source TEXT NOT NULL DEFAULT 'manual',
  last_error TEXT,
  last_attempt_at TIMESTAMPTZ,
  next_attempt_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_slope_scan_queue_status
  ON public.slope_scan_queue (status, next_attempt_at, created_at);

ALTER TABLE public.slope_scan_queue ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.slope_scan_queue FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.slope_scan_queue TO service_role;

CREATE TABLE IF NOT EXISTS public.slope_scan_state (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'paused', 'completed')),
  processed_count INTEGER NOT NULL DEFAULT 0 CHECK (processed_count >= 0),
  found_count INTEGER NOT NULL DEFAULT 0 CHECK (found_count >= 0),
  failed_count INTEGER NOT NULL DEFAULT 0 CHECK (failed_count >= 0),
  last_batch_started_at TIMESTAMPTZ,
  last_batch_finished_at TIMESTAMPTZ,
  last_error TEXT,
  lock_token TEXT,
  lock_until TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.slope_scan_state ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.slope_scan_state FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.slope_scan_state TO service_role;

INSERT INTO public.slope_scan_state (id, status)
VALUES (1, 'running')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.slope_scan_queue (slope_id, booking_url, source)
VALUES
  ('25fcbf83-ac1e-412b-bbee-b90550977539', 'https://booking.slope.it/25fcbf83-ac1e-412b-bbee-b90550977539', 'seed-utente'),
  ('5f60b982-b054-4e82-9ce2-098466ccf040', 'https://booking.slope.it/5f60b982-b054-4e82-9ce2-098466ccf040', 'archivio-4bid')
ON CONFLICT (slope_id) DO UPDATE SET
  booking_url = EXCLUDED.booking_url,
  updated_at = NOW();

COMMENT ON TABLE public.slope_properties IS
  'Directory privata dei recapiti pubblici esposti dai booking engine Slope.';
COMMENT ON TABLE public.slope_scan_queue IS
  'Coda di URL Slope con UUID verificati o da verificare; gli UUID Slope non sono progressivi.';
COMMENT ON TABLE public.slope_scan_state IS
  'Stato aggregato e lock ottimistico della scansione Slope.';
