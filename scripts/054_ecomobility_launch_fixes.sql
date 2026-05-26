-- Sprint pre-launch Ecomobility: schema fixes
-- 1) Colonna actual_pickup_datetime mancante (admin/bookings la scriveva su colonna inesistente)
-- 2) Tabella idempotency eventi Stripe
-- 3) Tabella refund/charge log per cauzione e delta

ALTER TABLE public.ecomobility_bookings
  ADD COLUMN IF NOT EXISTS actual_pickup_datetime TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_method_id TEXT,
  ADD COLUMN IF NOT EXISTS extra_charge_amount NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS extra_charge_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS extra_charge_status TEXT, -- 'pending' | 'succeeded' | 'failed' | 'not_needed'
  ADD COLUMN IF NOT EXISTS deposit_refund_id TEXT,
  ADD COLUMN IF NOT EXISTS deposit_refund_status TEXT, -- 'pending' | 'succeeded' | 'failed'
  ADD COLUMN IF NOT EXISTS deposit_refund_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Backfill stato veicolo / pickup
UPDATE public.ecomobility_bookings
SET actual_pickup_datetime = updated_at
WHERE status IN ('picked_up','returned','completed')
  AND actual_pickup_datetime IS NULL;

CREATE INDEX IF NOT EXISTS idx_ecomobility_bookings_status_pickup
  ON public.ecomobility_bookings(status, pickup_datetime);
CREATE INDEX IF NOT EXISTS idx_ecomobility_bookings_extra_charge_status
  ON public.ecomobility_bookings(extra_charge_status)
  WHERE extra_charge_status IS NOT NULL;

-- Idempotency webhook Stripe
CREATE TABLE IF NOT EXISTS public.ecomobility_stripe_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  account_id TEXT,
  livemode BOOLEAN,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB
);
CREATE INDEX IF NOT EXISTS idx_ecomobility_stripe_events_type
  ON public.ecomobility_stripe_events(type, processed_at DESC);

ALTER TABLE public.ecomobility_stripe_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access ecomobility_stripe_events"
  ON public.ecomobility_stripe_events;
CREATE POLICY "Service role full access ecomobility_stripe_events"
  ON public.ecomobility_stripe_events
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);
