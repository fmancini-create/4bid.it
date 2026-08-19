-- Archivio privato delle strutture che usano il booking engine Scidoo.
-- Tutti gli accessi applicativi passano da API server-side protette da superadmin.

CREATE TABLE IF NOT EXISTS public.scidoo_properties (
  scidoo_code INTEGER PRIMARY KEY CHECK (scidoo_code BETWEEN 1 AND 5000),
  name TEXT NOT NULL,
  email TEXT,
  emails TEXT[] NOT NULL DEFAULT '{}',
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
      COALESCE(phone, '') || ' ' ||
      COALESCE(website_url, '') || ' ' ||
      COALESCE(address, '') || ' ' ||
      COALESCE(postal_code, '') || ' ' ||
      COALESCE(city, '') || ' ' ||
      COALESCE(province, '') || ' ' ||
      COALESCE(region, '') || ' ' ||
      COALESCE(country, '')
    )
  ) STORED
);

CREATE INDEX IF NOT EXISTS idx_scidoo_properties_name ON public.scidoo_properties (name);
CREATE INDEX IF NOT EXISTS idx_scidoo_properties_city ON public.scidoo_properties (city);
CREATE INDEX IF NOT EXISTS idx_scidoo_properties_region ON public.scidoo_properties (region);
CREATE INDEX IF NOT EXISTS idx_scidoo_properties_active_code ON public.scidoo_properties (is_active, scidoo_code);
CREATE INDEX IF NOT EXISTS idx_scidoo_properties_last_checked ON public.scidoo_properties (last_checked_at DESC);

ALTER TABLE public.scidoo_properties ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.scidoo_properties FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.scidoo_properties TO service_role;

CREATE TABLE IF NOT EXISTS public.scidoo_scan_state (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  next_code INTEGER NOT NULL DEFAULT 1 CHECK (next_code BETWEEN 1 AND 5001),
  max_code INTEGER NOT NULL DEFAULT 5000 CHECK (max_code BETWEEN 1 AND 5000),
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'paused', 'completed')),
  scanned_count INTEGER NOT NULL DEFAULT 0 CHECK (scanned_count >= 0),
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

ALTER TABLE public.scidoo_scan_state ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.scidoo_scan_state FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.scidoo_scan_state TO service_role;

INSERT INTO public.scidoo_scan_state (id, next_code, max_code, status)
VALUES (1, 1, 5000, 'running')
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE public.scidoo_properties IS
  'Directory privato dei recapiti pubblici esposti dai booking engine Scidoo con codici 1-5000.';
COMMENT ON TABLE public.scidoo_scan_state IS
  'Cursore, stato e lock ottimistico della scansione progressiva Scidoo.';
