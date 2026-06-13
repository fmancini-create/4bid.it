-- =============================================================================
-- DEM "Solleciti caldi" (warm follow-up) — migration ADDITIVA e idempotente.
-- Nessuna colonna/tabella esistente viene rinominata o rimossa.
-- Le righe dem_campaigns esistenti diventano implicitamente campaign_kind='cold'.
-- =============================================================================

-- 1) Colonne aggiuntive su dem_campaigns -------------------------------------
ALTER TABLE public.dem_campaigns ADD COLUMN IF NOT EXISTS campaign_kind text DEFAULT 'cold';
ALTER TABLE public.dem_campaigns ADD COLUMN IF NOT EXISTS original_campaign_id uuid;
ALTER TABLE public.dem_campaigns ADD COLUMN IF NOT EXISTS followup_id uuid;
ALTER TABLE public.dem_campaigns ADD COLUMN IF NOT EXISTS sequence_step integer;
ALTER TABLE public.dem_campaigns ADD COLUMN IF NOT EXISTS daily_quota_total integer;
ALTER TABLE public.dem_campaigns ADD COLUMN IF NOT EXISTS daily_quota_cold integer;
ALTER TABLE public.dem_campaigns ADD COLUMN IF NOT EXISTS daily_quota_warm integer;
ALTER TABLE public.dem_campaigns ADD COLUMN IF NOT EXISTS warm_reallocate_unused boolean DEFAULT false;
ALTER TABLE public.dem_campaigns ADD COLUMN IF NOT EXISTS warm_priority boolean DEFAULT false;

-- Backfill: ogni campagna senza kind esplicito e' una campagna "fredda".
UPDATE public.dem_campaigns SET campaign_kind = 'cold' WHERE campaign_kind IS NULL;

-- FK opzionale verso la campagna originale (self reference). Aggiunta solo se assente.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'dem_campaigns_original_campaign_fk'
  ) THEN
    ALTER TABLE public.dem_campaigns
      ADD CONSTRAINT dem_campaigns_original_campaign_fk
      FOREIGN KEY (original_campaign_id) REFERENCES public.dem_campaigns(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_dem_campaigns_original ON public.dem_campaigns(original_campaign_id);
CREATE INDEX IF NOT EXISTS idx_dem_campaigns_followup ON public.dem_campaigns(followup_id);
CREATE INDEX IF NOT EXISTS idx_dem_campaigns_kind ON public.dem_campaigns(campaign_kind);

-- 2) dem_followups (definizione della sequenza per campagna originale) --------
CREATE TABLE IF NOT EXISTS public.dem_followups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_campaign_id uuid NOT NULL REFERENCES public.dem_campaigns(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Solleciti caldi',
  status text NOT NULL DEFAULT 'draft', -- draft|active|paused|stopped|completed
  audience_config jsonb NOT NULL DEFAULT '{"min_clicks":1,"recency_days":null}'::jsonb,
  warm_priority boolean NOT NULL DEFAULT false,
  reallocate_unused boolean NOT NULL DEFAULT false,
  scheduled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dem_followups_original ON public.dem_followups(original_campaign_id);
CREATE INDEX IF NOT EXISTS idx_dem_followups_status ON public.dem_followups(status);

-- 3) dem_followup_steps (max 3 step per sequenza) ----------------------------
CREATE TABLE IF NOT EXISTS public.dem_followup_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  followup_id uuid NOT NULL REFERENCES public.dem_followups(id) ON DELETE CASCADE,
  step_number integer NOT NULL CHECK (step_number BETWEEN 1 AND 3),
  enabled boolean NOT NULL DEFAULT true,
  subject text NOT NULL DEFAULT '',
  preheader text,
  html_template text NOT NULL DEFAULT '',
  cta_url text,
  delay_days integer NOT NULL DEFAULT 4,
  send_campaign_id uuid REFERENCES public.dem_campaigns(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending', -- pending|sending|sent|skipped
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (followup_id, step_number)
);

CREATE INDEX IF NOT EXISTS idx_dem_followup_steps_followup ON public.dem_followup_steps(followup_id);

-- 4) dem_followup_recipients (arruolamento + stato commerciale, canonico) -----
CREATE TABLE IF NOT EXISTS public.dem_followup_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  followup_id uuid NOT NULL REFERENCES public.dem_followups(id) ON DELETE CASCADE,
  original_campaign_id uuid NOT NULL REFERENCES public.dem_campaigns(id) ON DELETE CASCADE,
  original_recipient_id uuid REFERENCES public.dem_recipients(id) ON DELETE SET NULL,
  email text NOT NULL,
  nome text,
  cognome text,
  nome_azienda text,
  orig_open_count integer NOT NULL DEFAULT 0,
  orig_click_count integer NOT NULL DEFAULT 0,
  orig_last_click_at timestamptz,
  commercial_status text NOT NULL DEFAULT 'interessato',
  excluded boolean NOT NULL DEFAULT false,
  excluded_reason text,
  responded boolean NOT NULL DEFAULT false,
  demo_booked_at timestamptz,
  followups_sent integer NOT NULL DEFAULT 0,
  last_followup_at timestamptz,
  calendar_clicks integer NOT NULL DEFAULT 0,
  last_calendar_click_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (followup_id, email)
);

CREATE INDEX IF NOT EXISTS idx_dem_fr_followup ON public.dem_followup_recipients(followup_id);
CREATE INDEX IF NOT EXISTS idx_dem_fr_email ON public.dem_followup_recipients(email);
CREATE INDEX IF NOT EXISTS idx_dem_fr_commercial ON public.dem_followup_recipients(commercial_status);
CREATE INDEX IF NOT EXISTS idx_dem_fr_original ON public.dem_followup_recipients(original_campaign_id);

-- 5) RLS: service role full access (coerente con le altre tabelle dem_*) ------
ALTER TABLE public.dem_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dem_followup_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dem_followup_recipients ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='dem_followups' AND policyname='Service role full access dem_followups') THEN
    CREATE POLICY "Service role full access dem_followups" ON public.dem_followups
      FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='dem_followup_steps' AND policyname='Service role full access dem_followup_steps') THEN
    CREATE POLICY "Service role full access dem_followup_steps" ON public.dem_followup_steps
      FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='dem_followup_recipients' AND policyname='Service role full access dem_followup_recipients') THEN
    CREATE POLICY "Service role full access dem_followup_recipients" ON public.dem_followup_recipients
      FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;
