-- =====================================================
-- 4BID ECOMOBILITY - AGGIUNGI PARTI MANCANTI
-- =====================================================

-- Aggiungi colonne mancanti ai veicoli (se non esistono)
ALTER TABLE ecomobility_vehicles ADD COLUMN IF NOT EXISTS battery_status TEXT DEFAULT 'available' CHECK (battery_status IN ('available', 'charging', 'low'));
ALTER TABLE ecomobility_vehicles ADD COLUMN IF NOT EXISTS estimated_range_km INTEGER;
ALTER TABLE ecomobility_vehicles ADD COLUMN IF NOT EXISTS estimated_available_time TIMESTAMPTZ;
ALTER TABLE ecomobility_vehicles ADD COLUMN IF NOT EXISTS charging_time_minutes INTEGER DEFAULT 240;

-- Aggiungi colonne mancanti alle prenotazioni
ALTER TABLE ecomobility_bookings ADD COLUMN IF NOT EXISTS battery_level_pickup INTEGER;
ALTER TABLE ecomobility_bookings ADD COLUMN IF NOT EXISTS battery_level_return INTEGER;
ALTER TABLE ecomobility_bookings ADD COLUMN IF NOT EXISTS autonomy_declaration_accepted BOOLEAN DEFAULT false;

-- Crea tabella storico batteria se non esiste
CREATE TABLE IF NOT EXISTS ecomobility_battery_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES ecomobility_vehicles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES ecomobility_bookings(id),
  battery_level INTEGER NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('pickup', 'return', 'charge_start', 'charge_end', 'manual_update')),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crea tabelle hardware se non esistono
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

-- Crea tabelle billing se non esistono
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

CREATE TABLE IF NOT EXISTS ecomobility_invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES ecomobility_invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  item_type TEXT CHECK (item_type IN ('platform', 'device', 'transaction', 'setup', 'other'))
);

-- Abilita RLS sulle nuove tabelle
ALTER TABLE ecomobility_battery_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecomobility_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecomobility_device_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecomobility_subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecomobility_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecomobility_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecomobility_invoice_items ENABLE ROW LEVEL SECURITY;

-- Policy per nuove tabelle (DROP IF EXISTS + CREATE)
DROP POLICY IF EXISTS "Service role full access ecomobility_battery_history" ON ecomobility_battery_history;
DROP POLICY IF EXISTS "Authenticated full access ecomobility_battery_history" ON ecomobility_battery_history;
DROP POLICY IF EXISTS "Service role full access ecomobility_devices" ON ecomobility_devices;
DROP POLICY IF EXISTS "Authenticated full access ecomobility_devices" ON ecomobility_devices;
DROP POLICY IF EXISTS "Service role full access ecomobility_device_locations" ON ecomobility_device_locations;
DROP POLICY IF EXISTS "Authenticated full access ecomobility_device_locations" ON ecomobility_device_locations;
DROP POLICY IF EXISTS "Service role full access ecomobility_subscription_plans" ON ecomobility_subscription_plans;
DROP POLICY IF EXISTS "Authenticated full access ecomobility_subscription_plans" ON ecomobility_subscription_plans;
DROP POLICY IF EXISTS "Service role full access ecomobility_subscriptions" ON ecomobility_subscriptions;
DROP POLICY IF EXISTS "Authenticated full access ecomobility_subscriptions" ON ecomobility_subscriptions;
DROP POLICY IF EXISTS "Service role full access ecomobility_invoices" ON ecomobility_invoices;
DROP POLICY IF EXISTS "Authenticated full access ecomobility_invoices" ON ecomobility_invoices;
DROP POLICY IF EXISTS "Service role full access ecomobility_invoice_items" ON ecomobility_invoice_items;
DROP POLICY IF EXISTS "Authenticated full access ecomobility_invoice_items" ON ecomobility_invoice_items;

CREATE POLICY "Service role full access ecomobility_battery_history" ON ecomobility_battery_history FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access ecomobility_battery_history" ON ecomobility_battery_history FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access ecomobility_devices" ON ecomobility_devices FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access ecomobility_devices" ON ecomobility_devices FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access ecomobility_device_locations" ON ecomobility_device_locations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access ecomobility_device_locations" ON ecomobility_device_locations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access ecomobility_subscription_plans" ON ecomobility_subscription_plans FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access ecomobility_subscription_plans" ON ecomobility_subscription_plans FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access ecomobility_subscriptions" ON ecomobility_subscriptions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access ecomobility_subscriptions" ON ecomobility_subscriptions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access ecomobility_invoices" ON ecomobility_invoices FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access ecomobility_invoices" ON ecomobility_invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access ecomobility_invoice_items" ON ecomobility_invoice_items FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access ecomobility_invoice_items" ON ecomobility_invoice_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Inserisci piani abbonamento (se non esistono)
INSERT INTO ecomobility_subscription_plans (name, description, monthly_fee, annual_fee, device_fee_monthly, transaction_fee_pct, max_vehicles, max_devices, features) 
SELECT 'Starter', 'Per piccole strutture fino a 5 veicoli', 49.00, 490.00, 5.00, 5.00, 5, 5, '["dashboard", "prenotazioni", "reportistica_base"]'
WHERE NOT EXISTS (SELECT 1 FROM ecomobility_subscription_plans WHERE name = 'Starter');

INSERT INTO ecomobility_subscription_plans (name, description, monthly_fee, annual_fee, device_fee_monthly, transaction_fee_pct, max_vehicles, max_devices, features) 
SELECT 'Professional', 'Per strutture medie fino a 15 veicoli', 99.00, 990.00, 4.00, 4.00, 15, 15, '["dashboard", "prenotazioni", "reportistica_avanzata", "api_access", "multi_operatore"]'
WHERE NOT EXISTS (SELECT 1 FROM ecomobility_subscription_plans WHERE name = 'Professional');

INSERT INTO ecomobility_subscription_plans (name, description, monthly_fee, annual_fee, device_fee_monthly, transaction_fee_pct, max_vehicles, max_devices, features) 
SELECT 'Enterprise', 'Per grandi strutture, veicoli illimitati', 199.00, 1990.00, 3.00, 3.00, NULL, NULL, '["dashboard", "prenotazioni", "reportistica_avanzata", "api_access", "multi_operatore", "white_label", "supporto_prioritario"]'
WHERE NOT EXISTS (SELECT 1 FROM ecomobility_subscription_plans WHERE name = 'Enterprise');

-- Inserisci veicoli demo per Villa I Barronci (se non esistono)
DO $$
DECLARE
  v_structure_id UUID;
  v_vehicle_type_id UUID;
BEGIN
  SELECT id INTO v_structure_id FROM ecomobility_structures WHERE slug = 'villa-i-barronci' LIMIT 1;
  SELECT id INTO v_vehicle_type_id FROM ecomobility_vehicle_types WHERE structure_id = v_structure_id LIMIT 1;
  
  IF v_structure_id IS NOT NULL AND v_vehicle_type_id IS NOT NULL THEN
    INSERT INTO ecomobility_vehicles (structure_id, vehicle_type_id, code, name, status, battery_level, battery_status)
    SELECT v_structure_id, v_vehicle_type_id, 'BIKE-001', 'E-Bike City 1', 'available', 100, 'available'
    WHERE NOT EXISTS (SELECT 1 FROM ecomobility_vehicles WHERE code = 'BIKE-001' AND structure_id = v_structure_id);
    
    INSERT INTO ecomobility_vehicles (structure_id, vehicle_type_id, code, name, status, battery_level, battery_status)
    SELECT v_structure_id, v_vehicle_type_id, 'BIKE-002', 'E-Bike City 2', 'available', 85, 'available'
    WHERE NOT EXISTS (SELECT 1 FROM ecomobility_vehicles WHERE code = 'BIKE-002' AND structure_id = v_structure_id);
    
    INSERT INTO ecomobility_vehicles (structure_id, vehicle_type_id, code, name, status, battery_level, battery_status)
    SELECT v_structure_id, v_vehicle_type_id, 'BIKE-003', 'E-Bike City 3', 'charging', 25, 'charging'
    WHERE NOT EXISTS (SELECT 1 FROM ecomobility_vehicles WHERE code = 'BIKE-003' AND structure_id = v_structure_id);
  END IF;
END $$;

-- Inserisci operatore demo (se non esiste)
INSERT INTO ecomobility_operators (structure_id, name, email, role, is_active)
SELECT s.id, 'Reception Villa', 'reception@villaibarronci.it', 'admin', true
FROM ecomobility_structures s
WHERE s.slug = 'villa-i-barronci'
AND NOT EXISTS (SELECT 1 FROM ecomobility_operators WHERE email = 'reception@villaibarronci.it');

-- Inserisci condizioni noleggio demo (se non esistono)
INSERT INTO ecomobility_rental_conditions (structure_id, title, content, is_active)
SELECT s.id, 'Condizioni Generali di Noleggio', 
'1. Il noleggio è riservato a maggiorenni in possesso di documento di identità valido.
2. L''utilizzatore è responsabile del veicolo per tutta la durata del noleggio.
3. Il veicolo deve essere riconsegnato nelle stesse condizioni in cui è stato ritirato.
4. In caso di danni, l''utilizzatore è tenuto al risarcimento.
5. È vietato l''uso del veicolo sotto l''effetto di alcol o sostanze stupefacenti.
6. È obbligatorio l''uso del casco (se fornito).
7. La struttura non è responsabile per oggetti lasciati sul veicolo.
8. In caso di furto, è necessario sporgere denuncia alle autorità competenti.', 
true
FROM ecomobility_structures s
WHERE s.slug = 'villa-i-barronci'
AND NOT EXISTS (SELECT 1 FROM ecomobility_rental_conditions WHERE structure_id = s.id);
