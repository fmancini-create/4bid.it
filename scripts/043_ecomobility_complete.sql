-- =====================================================
-- 4BID ECOMOBILITY - SCRIPT COMPLETO
-- Eseguire in Supabase SQL Editor
-- =====================================================

-- 1. Strutture (multi-tenant)
CREATE TABLE IF NOT EXISTS ecomobility_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  address TEXT,
  city TEXT,
  province TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#f97316',
  secondary_color TEXT DEFAULT '#1f2937',
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Operatori
CREATE TABLE IF NOT EXISTS ecomobility_operators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  structure_id UUID REFERENCES ecomobility_structures(id) ON DELETE CASCADE,
  user_id UUID,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  password_hash TEXT,
  role TEXT DEFAULT 'operator' CHECK (role IN ('admin', 'operator', 'viewer')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tipi veicoli
CREATE TABLE IF NOT EXISTS ecomobility_vehicle_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  structure_id UUID REFERENCES ecomobility_structures(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'bike',
  max_speed_kmh INTEGER DEFAULT 25,
  avg_range_km INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Veicoli (flotta)
CREATE TABLE IF NOT EXISTS ecomobility_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  structure_id UUID REFERENCES ecomobility_structures(id) ON DELETE CASCADE,
  vehicle_type_id UUID REFERENCES ecomobility_vehicle_types(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'rented', 'maintenance', 'charging', 'unavailable')),
  battery_level INTEGER DEFAULT 100 CHECK (battery_level >= 0 AND battery_level <= 100),
  battery_status TEXT DEFAULT 'available' CHECK (battery_status IN ('available', 'charging', 'low')),
  estimated_range_km INTEGER,
  estimated_available_time TIMESTAMPTZ,
  charging_time_minutes INTEGER DEFAULT 240,
  last_maintenance_at TIMESTAMPTZ,
  total_rentals INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(structure_id, code)
);

-- 5. Pricing (tariffe decrescenti)
CREATE TABLE IF NOT EXISTS ecomobility_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  structure_id UUID REFERENCES ecomobility_structures(id) ON DELETE CASCADE,
  vehicle_type_id UUID REFERENCES ecomobility_vehicle_types(id),
  hour_1 DECIMAL(10,2) DEFAULT 8.00,
  hour_2 DECIMAL(10,2) DEFAULT 7.00,
  hour_3 DECIMAL(10,2) DEFAULT 6.00,
  hour_4 DECIMAL(10,2) DEFAULT 5.00,
  hour_5 DECIMAL(10,2) DEFAULT 4.50,
  hour_6 DECIMAL(10,2) DEFAULT 4.00,
  hour_7 DECIMAL(10,2) DEFAULT 3.50,
  hour_8_plus DECIMAL(10,2) DEFAULT 3.00,
  daily_cap DECIMAL(10,2) DEFAULT 35.00,
  deposit DECIMAL(10,2) DEFAULT 50.00,
  minimum_charge DECIMAL(10,2) DEFAULT 5.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(structure_id, vehicle_type_id)
);

-- 6. Clienti
CREATE TABLE IF NOT EXISTS ecomobility_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  structure_id UUID REFERENCES ecomobility_structures(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  room_number TEXT,
  id_document_type TEXT CHECK (id_document_type IN ('identity_card', 'passport', 'driving_license')),
  id_document_number TEXT,
  id_document_photo_url TEXT,
  driving_license_photo_url TEXT,
  documents_verified BOOLEAN DEFAULT false,
  documents_verified_at TIMESTAMPTZ,
  documents_verified_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Prenotazioni
CREATE TABLE IF NOT EXISTS ecomobility_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  structure_id UUID REFERENCES ecomobility_structures(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES ecomobility_customers(id),
  vehicle_id UUID REFERENCES ecomobility_vehicles(id),
  booking_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  pickup_datetime TIMESTAMPTZ NOT NULL,
  expected_return_datetime TIMESTAMPTZ,
  actual_return_datetime TIMESTAMPTZ,
  battery_level_pickup INTEGER,
  battery_level_return INTEGER,
  estimated_amount DECIMAL(10,2),
  final_amount DECIMAL(10,2),
  deposit_amount DECIMAL(10,2),
  deposit_returned BOOLEAN DEFAULT false,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'partial')),
  payment_method TEXT,
  conditions_accepted BOOLEAN DEFAULT false,
  conditions_accepted_at TIMESTAMPTZ,
  autonomy_declaration_accepted BOOLEAN DEFAULT false,
  damage_reported BOOLEAN DEFAULT false,
  damage_description TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Foto riconsegna
CREATE TABLE IF NOT EXISTS ecomobility_return_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES ecomobility_bookings(id) ON DELETE CASCADE,
  photo_type TEXT NOT NULL CHECK (photo_type IN ('front', 'back', 'left', 'right', 'damage', 'other')),
  photo_url TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Log operazioni
CREATE TABLE IF NOT EXISTS ecomobility_operation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  structure_id UUID REFERENCES ecomobility_structures(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES ecomobility_bookings(id),
  vehicle_id UUID REFERENCES ecomobility_vehicles(id),
  operator_id UUID REFERENCES ecomobility_operators(id),
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Notifiche
CREATE TABLE IF NOT EXISTS ecomobility_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  structure_id UUID REFERENCES ecomobility_structures(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES ecomobility_bookings(id),
  customer_id UUID REFERENCES ecomobility_customers(id),
  type TEXT NOT NULL CHECK (type IN ('booking_confirmation', 'pickup_reminder', 'return_reminder', 'documents_approved', 'documents_rejected', 'payment_confirmation')),
  channel TEXT DEFAULT 'email' CHECK (channel IN ('email', 'sms', 'push')),
  recipient TEXT NOT NULL,
  subject TEXT,
  content TEXT,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Condizioni noleggio
CREATE TABLE IF NOT EXISTS ecomobility_rental_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  structure_id UUID REFERENCES ecomobility_structures(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Manutenzioni
CREATE TABLE IF NOT EXISTS ecomobility_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES ecomobility_vehicles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('scheduled', 'repair', 'inspection', 'battery_replacement')),
  description TEXT,
  cost DECIMAL(10,2),
  performed_by TEXT,
  performed_at TIMESTAMPTZ DEFAULT NOW(),
  next_maintenance_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Storico batteria
CREATE TABLE IF NOT EXISTS ecomobility_battery_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES ecomobility_vehicles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES ecomobility_bookings(id),
  battery_level INTEGER NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('pickup', 'return', 'charge_start', 'charge_end', 'manual_update')),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Dispositivi Hardware
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

-- 15. Log posizioni GPS
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

-- 16. Piani abbonamento
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

-- 17. Abbonamenti strutture
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

-- 18. Fatture
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

-- 19. Dettaglio fatture
CREATE TABLE IF NOT EXISTS ecomobility_invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES ecomobility_invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  item_type TEXT CHECK (item_type IN ('platform', 'device', 'transaction', 'setup', 'other'))
);

-- =====================================================
-- INDICI
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_eco_vehicles_structure ON ecomobility_vehicles(structure_id);
CREATE INDEX IF NOT EXISTS idx_eco_vehicles_status ON ecomobility_vehicles(status);
CREATE INDEX IF NOT EXISTS idx_eco_bookings_structure ON ecomobility_bookings(structure_id);
CREATE INDEX IF NOT EXISTS idx_eco_bookings_status ON ecomobility_bookings(status);
CREATE INDEX IF NOT EXISTS idx_eco_bookings_code ON ecomobility_bookings(booking_code);
CREATE INDEX IF NOT EXISTS idx_eco_customers_structure ON ecomobility_customers(structure_id);
CREATE INDEX IF NOT EXISTS idx_eco_customers_email ON ecomobility_customers(email);
CREATE INDEX IF NOT EXISTS idx_eco_devices_structure ON ecomobility_devices(structure_id);
CREATE INDEX IF NOT EXISTS idx_eco_devices_vehicle ON ecomobility_devices(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_eco_device_locations_device ON ecomobility_device_locations(device_id);
CREATE INDEX IF NOT EXISTS idx_eco_subscriptions_structure ON ecomobility_subscriptions(structure_id);
CREATE INDEX IF NOT EXISTS idx_eco_invoices_structure ON ecomobility_invoices(structure_id);

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================
ALTER TABLE ecomobility_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecomobility_operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecomobility_vehicle_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecomobility_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecomobility_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecomobility_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecomobility_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecomobility_return_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecomobility_operation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecomobility_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecomobility_rental_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecomobility_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecomobility_battery_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecomobility_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecomobility_device_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecomobility_subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecomobility_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecomobility_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecomobility_invoice_items ENABLE ROW LEVEL SECURITY;

-- Policy service role (accesso completo)
CREATE POLICY "Service role full access ecomobility_structures" ON ecomobility_structures FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access ecomobility_operators" ON ecomobility_operators FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access ecomobility_vehicle_types" ON ecomobility_vehicle_types FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access ecomobility_vehicles" ON ecomobility_vehicles FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access ecomobility_pricing" ON ecomobility_pricing FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access ecomobility_customers" ON ecomobility_customers FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access ecomobility_bookings" ON ecomobility_bookings FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access ecomobility_return_photos" ON ecomobility_return_photos FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access ecomobility_operation_logs" ON ecomobility_operation_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access ecomobility_notifications" ON ecomobility_notifications FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access ecomobility_rental_conditions" ON ecomobility_rental_conditions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access ecomobility_maintenance" ON ecomobility_maintenance FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access ecomobility_battery_history" ON ecomobility_battery_history FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access ecomobility_devices" ON ecomobility_devices FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access ecomobility_device_locations" ON ecomobility_device_locations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access ecomobility_subscription_plans" ON ecomobility_subscription_plans FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access ecomobility_subscriptions" ON ecomobility_subscriptions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access ecomobility_invoices" ON ecomobility_invoices FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access ecomobility_invoice_items" ON ecomobility_invoice_items FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Policy authenticated (accesso completo per admin 4BID)
CREATE POLICY "Authenticated full access ecomobility_structures" ON ecomobility_structures FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access ecomobility_operators" ON ecomobility_operators FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access ecomobility_vehicle_types" ON ecomobility_vehicle_types FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access ecomobility_vehicles" ON ecomobility_vehicles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access ecomobility_pricing" ON ecomobility_pricing FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access ecomobility_customers" ON ecomobility_customers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access ecomobility_bookings" ON ecomobility_bookings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access ecomobility_return_photos" ON ecomobility_return_photos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access ecomobility_operation_logs" ON ecomobility_operation_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access ecomobility_notifications" ON ecomobility_notifications FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access ecomobility_rental_conditions" ON ecomobility_rental_conditions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access ecomobility_maintenance" ON ecomobility_maintenance FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access ecomobility_battery_history" ON ecomobility_battery_history FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access ecomobility_devices" ON ecomobility_devices FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access ecomobility_device_locations" ON ecomobility_device_locations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access ecomobility_subscription_plans" ON ecomobility_subscription_plans FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access ecomobility_subscriptions" ON ecomobility_subscriptions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access ecomobility_invoices" ON ecomobility_invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access ecomobility_invoice_items" ON ecomobility_invoice_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Policy anon (accesso pubblico in lettura per strutture attive)
CREATE POLICY "Anon read active structures" ON ecomobility_structures FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "Anon read vehicle types" ON ecomobility_vehicle_types FOR SELECT TO anon USING (true);
CREATE POLICY "Anon read available vehicles" ON ecomobility_vehicles FOR SELECT TO anon USING (status IN ('available', 'charging'));
CREATE POLICY "Anon read pricing" ON ecomobility_pricing FOR SELECT TO anon USING (true);
CREATE POLICY "Anon read rental conditions" ON ecomobility_rental_conditions FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "Anon insert customers" ON ecomobility_customers FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon insert bookings" ON ecomobility_bookings FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon read own booking" ON ecomobility_bookings FOR SELECT TO anon USING (true);
CREATE POLICY "Anon update own booking" ON ecomobility_bookings FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon insert return photos" ON ecomobility_return_photos FOR INSERT TO anon WITH CHECK (true);

-- =====================================================
-- DATI INIZIALI
-- =====================================================

-- Piani abbonamento
INSERT INTO ecomobility_subscription_plans (name, description, monthly_fee, annual_fee, device_fee_monthly, transaction_fee_pct, max_vehicles, max_devices, features) VALUES
('Starter', 'Per piccole strutture fino a 5 veicoli', 49.00, 490.00, 5.00, 5.00, 5, 5, '["dashboard", "prenotazioni", "reportistica_base"]'),
('Professional', 'Per strutture medie fino a 15 veicoli', 99.00, 990.00, 4.00, 4.00, 15, 15, '["dashboard", "prenotazioni", "reportistica_avanzata", "api_access", "multi_operatore"]'),
('Enterprise', 'Per grandi strutture, veicoli illimitati', 199.00, 1990.00, 3.00, 3.00, NULL, NULL, '["dashboard", "prenotazioni", "reportistica_avanzata", "api_access", "multi_operatore", "white_label", "supporto_prioritario"]')
ON CONFLICT DO NOTHING;

-- Struttura demo
INSERT INTO ecomobility_structures (name, slug, address, city, province, email, phone, primary_color)
VALUES ('Villa I Barronci', 'villa-i-barronci', 'Via Sorripa, 10', 'San Casciano in Val di Pesa', 'FI', 'info@villaibarronci.it', '+39 055 123456', '#f97316')
ON CONFLICT (slug) DO NOTHING;

-- Tipo veicolo demo
INSERT INTO ecomobility_vehicle_types (structure_id, name, description, icon, max_speed_kmh, avg_range_km)
SELECT id, 'E-Bike City', 'Bicicletta elettrica per escursioni in citta', 'bike', 25, 60
FROM ecomobility_structures WHERE slug = 'villa-i-barronci'
ON CONFLICT DO NOTHING;

-- Pricing demo
INSERT INTO ecomobility_pricing (structure_id, vehicle_type_id, hour_1, hour_2, hour_3, hour_4, hour_5, hour_6, hour_7, hour_8_plus, daily_cap, deposit, minimum_charge)
SELECT s.id, vt.id, 8.00, 7.00, 6.00, 5.00, 4.50, 4.00, 3.50, 3.00, 35.00, 50.00, 5.00
FROM ecomobility_structures s
JOIN ecomobility_vehicle_types vt ON vt.structure_id = s.id
WHERE s.slug = 'villa-i-barronci'
ON CONFLICT DO NOTHING;

-- Veicoli demo
INSERT INTO ecomobility_vehicles (structure_id, vehicle_type_id, code, name, description, status, battery_level)
SELECT s.id, vt.id, 'EB-001', 'E-Bike Rossa', 'E-bike city rossa con cestino', 'available', 100
FROM ecomobility_structures s
JOIN ecomobility_vehicle_types vt ON vt.structure_id = s.id
WHERE s.slug = 'villa-i-barronci'
ON CONFLICT DO NOTHING;

INSERT INTO ecomobility_vehicles (structure_id, vehicle_type_id, code, name, description, status, battery_level)
SELECT s.id, vt.id, 'EB-002', 'E-Bike Blu', 'E-bike city blu con portapacchi', 'available', 85
FROM ecomobility_structures s
JOIN ecomobility_vehicle_types vt ON vt.structure_id = s.id
WHERE s.slug = 'villa-i-barronci'
ON CONFLICT DO NOTHING;

INSERT INTO ecomobility_vehicles (structure_id, vehicle_type_id, code, name, description, status, battery_level)
SELECT s.id, vt.id, 'EB-003', 'E-Bike Verde', 'E-bike city verde sportiva', 'charging', 30
FROM ecomobility_structures s
JOIN ecomobility_vehicle_types vt ON vt.structure_id = s.id
WHERE s.slug = 'villa-i-barronci'
ON CONFLICT DO NOTHING;

-- Operatore: da creare manualmente tramite l'interfaccia admin
-- Non inserire credenziali demo nel codice sorgente

-- Condizioni noleggio demo
INSERT INTO ecomobility_rental_conditions (structure_id, title, content)
SELECT id, 'Termini e Condizioni Noleggio E-Bike', 
'1. Il noleggiatore deve essere maggiorenne e in possesso di documento di identita valido.
2. E obbligatorio indossare il casco durante la guida.
3. Il veicolo deve essere riconsegnato nelle stesse condizioni in cui e stato ritirato.
4. In caso di danni o furto, il noleggiatore e responsabile fino all''importo della cauzione.
5. E vietato l''uso del veicolo sotto l''effetto di alcol o sostanze stupefacenti.
6. Il noleggiatore dichiara di saper guidare il veicolo e di conoscere il codice della strada.
7. In caso di incidente, contattare immediatamente la struttura.
8. La tariffa e calcolata in base alle ore effettive di utilizzo con pricing decrescente.'
FROM ecomobility_structures WHERE slug = 'villa-i-barronci'
ON CONFLICT DO NOTHING;
