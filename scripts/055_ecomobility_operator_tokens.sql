-- 055_ecomobility_operator_tokens.sql
-- Sprint 2: reset/invite password operator + reminder ritiro

-- Token monouso per invite e reset password operatori struttura
CREATE TABLE IF NOT EXISTS public.ecomobility_operator_password_tokens (
  token        TEXT PRIMARY KEY,
  operator_id  UUID NOT NULL REFERENCES public.ecomobility_operators(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('invite', 'reset')),
  expires_at   TIMESTAMPTZ NOT NULL,
  used_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ecomob_op_tokens_operator
  ON public.ecomobility_operator_password_tokens(operator_id);

CREATE INDEX IF NOT EXISTS idx_ecomob_op_tokens_expires
  ON public.ecomobility_operator_password_tokens(expires_at) WHERE used_at IS NULL;

ALTER TABLE public.ecomobility_operator_password_tokens ENABLE ROW LEVEL SECURITY;

-- Service role only (gestione via API admin)
DROP POLICY IF EXISTS "service_role_all" ON public.ecomobility_operator_password_tokens;
CREATE POLICY "service_role_all" ON public.ecomobility_operator_password_tokens
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Reminder ritiro inviato (idempotency 24h email)
ALTER TABLE public.ecomobility_bookings
  ADD COLUMN IF NOT EXISTS pickup_reminder_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_ecomob_bookings_reminder_pending
  ON public.ecomobility_bookings(pickup_datetime)
  WHERE pickup_reminder_sent_at IS NULL AND status IN ('confirmed', 'pending');
