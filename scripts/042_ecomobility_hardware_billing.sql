-- =====================================================
-- 4BID ECOMOBILITY - HARDWARE & BILLING
-- Modello 2: Piattaforma + Hardware
-- =====================================================

-- 1. Dispositivi Hardware (tracker GPS, lucchetti smart)
CREATE TABLE IF NOT EXISTS ecomobility_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  structure_id UUID REFERENCES ecomobility_structures(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES ecomobility_vehicles(id) ON DELETE SET NULL,
  device_type TEXT NOT NULL CHECK (device_type IN ('gps_tracker', 'smart_lock', 'battery_sensor', 'combo')),
  serial_number TEXT UNIQUE NOT NULL,
  model TEXT,
  manufacturer TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'lost')),
  last_ping_at TIMESTAMPTZ,
  last_location_lat DECIMAL(10, 8),
  last_location_lng DECIMAL(11, 8),
  battery_level INTEGER CHECK (battery_level >= 0 AND battery_level <= 100),
  firmware_version TEXT,
  installed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Log posizioni GPS
CREATE TABLE IF NOT EXISTS ecomobility_device_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES ecomobility_devices(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES ecomobility_bookings(id),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  speed_kmh DECIMAL(5, 2),
  altitude_m DECIMAL(7, 2),
  accuracy_m DECIMAL(6, 2),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Piani abbonamento
CREATE TABLE IF NOT EXISTS ecomobility_subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  monthly_fee DECIMAL(10, 2) NOT NULL,
  annual_fee DECIMAL(10, 2),
  device_fee_monthly DECIMAL(10, 2) DEFAULT 5.00,
  transaction_fee_pct DECIMAL(5, 2) DEFAULT 5.00,
  max_vehicles INTEGER,
  max_devices INTEGER,
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Abbonamenti strutture
CREATE TABLE IF NOT EXISTS ecomobility_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  structure_id UUID REFERENCES ecomobility_structures(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES ecomobility_subscription_plans(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('trial', 'active', 'suspended', 'cancelled')),
  billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
  current_period_start TIMESTAMPTZ DEFAULT NOW(),
  current_period_end TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  payment_method TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Fatture
CREATE TABLE IF NOT EXISTS ecomobility_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  structure_id UUID REFERENCES ecomobility_structures(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES ecomobility_subscriptions(id),
  invoice_number TEXT UNIQUE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  platform_fee DECIMAL(10, 2) DEFAULT 0,
  devices_fee DECIMAL(10, 2) DEFAULT 0,
  transactions_fee DECIMAL(10, 2) DEFAULT 0,
  subtotal DECIMAL(10, 2) NOT NULL,
  vat_rate DECIMAL(5, 2) DEFAULT 22.00,
  vat_amount DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  due_date DATE,
  paid_at TIMESTAMPTZ,
  payment_method TEXT,
  notes TEXT,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Dettaglio fatture
CREATE TABLE IF NOT EXISTS ecomobility_invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES ecomobility_invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  item_type TEXT CHECK (item_type IN ('platform', 'device', 'transaction', 'setup', 'other'))
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_eco_devices_structure ON ecomobility_devices(structure_id);
CREATE INDEX IF NOT EXISTS idx_eco_devices_vehicle ON ecomobility_devices(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_eco_device_locations_device ON ecomobility_device_locations(device_id);
CREATE INDEX IF NOT EXISTS idx_eco_device_locations_booking ON ecomobility_device_locations(booking_id);
CREATE INDEX IF NOT EXISTS idx_eco_subscriptions_structure ON ecomobility_subscriptions(structure_id);
CREATE INDEX IF NOT EXISTS idx_eco_invoices_structure ON ecomobility_invoices(structure_id);

-- RLS
ALTER TABLE ecomobility_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecomobility_device_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecomobility_subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecomobility_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecomobility_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecomobility_invoice_items ENABLE ROW LEVEL SECURITY;

-- Policy service role
CREATE POLICY "Service role full access ecomobility_devices" ON ecomobility_devices FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access ecomobility_device_locations" ON ecomobility_device_locations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access ecomobility_subscription_plans" ON ecomobility_subscription_plans FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access ecomobility_subscriptions" ON ecomobility_subscriptions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access ecomobility_invoices" ON ecomobility_invoices FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access ecomobility_invoice_items" ON ecomobility_invoice_items FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Policy authenticated
CREATE POLICY "Authenticated full access ecomobility_devices" ON ecomobility_devices FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access ecomobility_device_locations" ON ecomobility_device_locations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access ecomobility_subscription_plans" ON ecomobility_subscription_plans FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access ecomobility_subscriptions" ON ecomobility_subscriptions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access ecomobility_invoices" ON ecomobility_invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access ecomobility_invoice_items" ON ecomobility_invoice_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Inserisci piani abbonamento di default
INSERT INTO ecomobility_subscription_plans (name, description, monthly_fee, annual_fee, device_fee_monthly, transaction_fee_pct, max_vehicles, max_devices, features) VALUES
('Starter', 'Per piccole strutture fino a 5 veicoli', 49.00, 490.00, 5.00, 5.00, 5, 5, '["dashboard", "prenotazioni", "reportistica_base"]'),
('Professional', 'Per strutture medie fino a 15 veicoli', 99.00, 990.00, 4.00, 4.00, 15, 15, '["dashboard", "prenotazioni", "reportistica_avanzata", "api_access", "multi_operatore"]'),
('Enterprise', 'Per grandi strutture, veicoli illimitati', 199.00, 1990.00, 3.00, 3.00, NULL, NULL, '["dashboard", "prenotazioni", "reportistica_avanzata", "api_access", "multi_operatore", "white_label", "supporto_prioritario"]')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE ecomobility_devices IS 'Dispositivi hardware (GPS tracker, lucchetti smart) forniti da 4BID';
COMMENT ON TABLE ecomobility_subscriptions IS 'Abbonamenti delle strutture ai piani 4BID Ecomobility';
COMMENT ON TABLE ecomobility_invoices IS 'Fatture mensili alle strutture';
