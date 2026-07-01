-- Preventivi "Ottimizzazione Canali di Vendita"
-- Tabella unica che gestisce l'intero ciclo: bozza admin -> invio email ->
-- compilazione campi dal cliente -> accettazione (firma) -> pagamento (bonifico/carta).

CREATE TABLE IF NOT EXISTS sales_channel_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Intestatario
  client_name text NOT NULL DEFAULT '',
  client_company text,
  client_email text,
  client_vat text,
  client_address text,

  -- Contenuto preventivo
  title text NOT NULL DEFAULT 'Ottimizzazione Canali di Vendita',
  description text,            -- parte descrittiva (testo/markdown)
  payment_terms text,          -- condizioni di pagamento (testo libero)

  -- Importi flessibili (decisi volta per volta)
  line_items jsonb NOT NULL DEFAULT '[]'::jsonb,   -- [{label, qty, unit_price}]
  total_amount numeric,        -- totale (puo' essere calcolato o inserito a mano)
  deposit_amount numeric,      -- acconto opzionale
  vat_included boolean NOT NULL DEFAULT true,
  currency text NOT NULL DEFAULT 'eur',

  -- Campi richiesti al cliente (configurabili per preventivo)
  requested_fields jsonb NOT NULL DEFAULT '[]'::jsonb, -- [{key,label,type,required}]
  -- Risposte del cliente (chiave -> valore). Dati sensibili: solo service role.
  submitted_fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  submitted_at timestamptz,

  -- Accettazione
  accepted_at timestamptz,
  acceptance_name text,        -- firma: nome/cognome digitato
  acceptance_ip text,

  -- Pagamento
  payment_method text CHECK (payment_method IN ('bonifico','card')),
  payment_status text CHECK (payment_status IN ('pending','awaiting_transfer','paid')),
  stripe_session_id text,
  paid_at timestamptz,

  -- Accesso pubblico / stato
  token uuid UNIQUE,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','accepted','paid')),
  sent_at timestamptz,
  expires_at timestamptz,

  -- Solleciti automatici (cron) per i preventivi inviati e non ancora accettati
  reminder_count integer NOT NULL DEFAULT 0,
  last_reminder_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_scq_token ON sales_channel_quotes(token);
CREATE INDEX IF NOT EXISTS idx_scq_status ON sales_channel_quotes(status);
CREATE INDEX IF NOT EXISTS idx_scq_created ON sales_channel_quotes(created_at DESC);

ALTER TABLE sales_channel_quotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access sales_channel_quotes" ON sales_channel_quotes;
CREATE POLICY "Service role full access sales_channel_quotes"
  ON sales_channel_quotes FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Idempotenza eventi Stripe per il webhook dei preventivi
CREATE TABLE IF NOT EXISTS sales_channel_quote_stripe_events (
  id text PRIMARY KEY,
  type text,
  livemode boolean,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sales_channel_quote_stripe_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access scq_stripe_events" ON sales_channel_quote_stripe_events;
CREATE POLICY "Service role full access scq_stripe_events"
  ON sales_channel_quote_stripe_events FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
