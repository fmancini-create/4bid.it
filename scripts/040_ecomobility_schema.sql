-- =====================================================
-- 4BID ECOMOBILITY - Schema Database Multi-Tenant
-- Sistema di noleggio mobilità elettrica leggera
-- =====================================================

-- 1. STRUTTURE (Tenant)
-- Hotel, resort, agriturismi che usano il servizio
CREATE TABLE IF NOT EXISTS ecomobility_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  address TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'IT',
  phone TEXT,
  email TEXT,
  website TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  primary_color TEXT DEFAULT '#f97316',
  secondary_color TEXT DEFAULT '#ea580c',
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. OPERATORI (Admin struttura, manutentori, reception)
CREATE TABLE IF NOT EXISTS ecomobility_operators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  structure_id UUID REFERENCES ecomobility_structures(id) ON DELETE CASCADE,
  user_id UUID, -- collegamento a auth.users di Supabase se necessario
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'operator', 'maintenance', 'reception')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(structure_id, email)
);

-- 3. TIPI DI VEICOLI
CREATE TABLE IF NOT EXISTS ecomobility_vehicle_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('ebike', 'scooter', 'monopattino', 'quad', 'altro')),
  image_url TEXT,
  max_speed_kmh INTEGER,
  range_km INTEGER,
  weight_kg NUMERIC(5,2),
  requires_license_type TEXT, -- 'AM', 'A1', 'A2', 'A', 'B', 'nessuna'
  min_age INTEGER DEFAULT 18,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. FLOTTA VEICOLI (veicoli specifici di ogni struttura)
CREATE TABLE IF NOT EXISTS ecomobility_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  structure_id UUID REFERENCES ecomobility_structures(id) ON DELETE CASCADE,
  vehicle_type_id UUID REFERENCES ecomobility_vehicle_types(id),
  internal_code TEXT NOT NULL, -- codice interno es. "EBIKE-001"
  brand TEXT,
  model TEXT,
  year INTEGER,
  color TEXT,
  serial_number TEXT,
  license_plate TEXT,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'rented', 'maintenance', 'charging', 'damaged', 'retired')),
  battery_level INTEGER CHECK (battery_level >= 0 AND battery_level <= 100),
  last_maintenance_at TIMESTAMPTZ,
  next_maintenance_at TIMESTAMPTZ,
  total_rentals INTEGER DEFAULT 0,
  total_km NUMERIC(10,2) DEFAULT 0,
  notes TEXT,
  images JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(structure_id, internal_code)
);

-- 5. TARIFFE (pricing decrescente per struttura e tipo veicolo)
CREATE TABLE IF NOT EXISTS ecomobility_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  structure_id UUID REFERENCES ecomobility_structures(id) ON DELETE CASCADE,
  vehicle_type_id UUID REFERENCES ecomobility_vehicle_types(id),
  name TEXT NOT NULL,
  description TEXT,
  -- Pricing decrescente
  min_price NUMERIC(10,2) NOT NULL, -- prezzo minimo obbligatorio
  price_first_hour NUMERIC(10,2) NOT NULL, -- prezzo prima ora
  price_second_hour NUMERIC(10,2), -- prezzo seconda ora
  price_third_hour NUMERIC(10,2), -- prezzo terza ora
  price_per_hour_after NUMERIC(10,2), -- prezzo per ore successive
  max_price_day NUMERIC(10,2) NOT NULL, -- cap giornaliero
  -- Cauzione
  deposit_amount NUMERIC(10,2) NOT NULL DEFAULT 100,
  -- Validità
  valid_from DATE,
  valid_to DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CLIENTI
CREATE TABLE IF NOT EXISTS ecomobility_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  date_of_birth DATE,
  nationality TEXT,
  fiscal_code TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT,
  -- Documenti di guida
  license_type TEXT, -- 'AM', 'A1', 'A2', 'A', 'B'
  license_number TEXT,
  license_country TEXT,
  license_expiry DATE,
  license_front_url TEXT,
  license_back_url TEXT,
  -- Patente internazionale (per extra-UE)
  idp_number TEXT,
  idp_expiry DATE,
  idp_url TEXT,
  -- Documento identità
  id_type TEXT, -- 'carta_identita', 'passaporto'
  id_number TEXT,
  id_expiry DATE,
  id_front_url TEXT,
  id_back_url TEXT,
  -- Stato verifica
  documents_status TEXT DEFAULT 'pending' CHECK (documents_status IN ('pending', 'submitted', 'verified', 'rejected', 'expired')),
  documents_verified_at TIMESTAMPTZ,
  documents_verified_by UUID,
  documents_rejection_reason TEXT,
  driving_enabled BOOLEAN DEFAULT false,
  -- Stripe
  stripe_customer_id TEXT,
  -- Stats
  total_rentals INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PRENOTAZIONI
CREATE TABLE IF NOT EXISTS ecomobility_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  structure_id UUID REFERENCES ecomobility_structures(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES ecomobility_customers(id),
  vehicle_id UUID REFERENCES ecomobility_vehicles(id),
  pricing_id UUID REFERENCES ecomobility_pricing(id),
  -- Codice prenotazione
  booking_code TEXT UNIQUE NOT NULL,
  -- Date e orari
  pickup_date DATE NOT NULL,
  pickup_time TIME NOT NULL,
  expected_return_date DATE,
  expected_return_time TIME,
  actual_pickup_at TIMESTAMPTZ,
  actual_return_at TIMESTAMPTZ,
  -- Stato
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',        -- in attesa di pagamento/documenti
    'confirmed',      -- pagamento ok, documenti ok
    'ready',          -- pronto per ritiro
    'picked_up',      -- ritirato
    'returning',      -- riconsegna in corso
    'returned',       -- riconsegnato
    'completed',      -- completato (cauzione sbloccata)
    'cancelled',      -- cancellato
    'disputed'        -- contestazione
  )),
  -- Importi
  estimated_amount NUMERIC(10,2),
  final_amount NUMERIC(10,2),
  deposit_amount NUMERIC(10,2),
  deposit_status TEXT DEFAULT 'pending' CHECK (deposit_status IN ('pending', 'held', 'released', 'charged')),
  -- Pagamenti Stripe
  stripe_payment_intent_id TEXT,
  stripe_deposit_intent_id TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
  -- Autodichiarazione
  self_declaration_accepted BOOLEAN DEFAULT false,
  self_declaration_at TIMESTAMPTZ,
  terms_accepted BOOLEAN DEFAULT false,
  terms_accepted_at TIMESTAMPTZ,
  -- Voucher
  voucher_url TEXT,
  voucher_sent_at TIMESTAMPTZ,
  -- Note
  customer_notes TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. FOTO RICONSEGNA
CREATE TABLE IF NOT EXISTS ecomobility_return_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES ecomobility_bookings(id) ON DELETE CASCADE,
  photo_type TEXT NOT NULL CHECK (photo_type IN ('front', 'back', 'left', 'right', 'damage', 'other')),
  image_url TEXT NOT NULL,
  has_damage BOOLEAN DEFAULT false,
  damage_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. LOG OPERAZIONI
CREATE TABLE IF NOT EXISTS ecomobility_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  structure_id UUID REFERENCES ecomobility_structures(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES ecomobility_bookings(id),
  vehicle_id UUID REFERENCES ecomobility_vehicles(id),
  customer_id UUID REFERENCES ecomobility_customers(id),
  operator_id UUID REFERENCES ecomobility_operators(id),
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. NOTIFICHE
CREATE TABLE IF NOT EXISTS ecomobility_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  structure_id UUID REFERENCES ecomobility_structures(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES ecomobility_bookings(id),
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('customer', 'admin', 'operator', 'maintenance')),
  recipient_email TEXT,
  recipient_id UUID,
  notification_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  channel TEXT DEFAULT 'email' CHECK (channel IN ('email', 'sms', 'push', 'whatsapp')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. CONDIZIONI DI NOLEGGIO (personalizzabili per struttura)
CREATE TABLE IF NOT EXISTS ecomobility_rental_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  structure_id UUID REFERENCES ecomobility_structures(id) ON DELETE CASCADE,
  language TEXT DEFAULT 'it',
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(structure_id, language, version)
);

-- 12. MANUTENZIONI
CREATE TABLE IF NOT EXISTS ecomobility_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES ecomobility_vehicles(id) ON DELETE CASCADE,
  operator_id UUID REFERENCES ecomobility_operators(id),
  maintenance_type TEXT NOT NULL CHECK (maintenance_type IN ('cleaning', 'charging', 'repair', 'inspection', 'tire', 'battery', 'other')),
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cost NUMERIC(10,2),
  notes TEXT,
  photos JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDICI
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_ecomobility_structures_slug ON ecomobility_structures(slug);
CREATE INDEX IF NOT EXISTS idx_ecomobility_operators_structure ON ecomobility_operators(structure_id);
CREATE INDEX IF NOT EXISTS idx_ecomobility_operators_email ON ecomobility_operators(email);
CREATE INDEX IF NOT EXISTS idx_ecomobility_vehicles_structure ON ecomobility_vehicles(structure_id);
CREATE INDEX IF NOT EXISTS idx_ecomobility_vehicles_status ON ecomobility_vehicles(structure_id, status);
CREATE INDEX IF NOT EXISTS idx_ecomobility_pricing_structure ON ecomobility_pricing(structure_id);
CREATE INDEX IF NOT EXISTS idx_ecomobility_customers_email ON ecomobility_customers(email);
CREATE INDEX IF NOT EXISTS idx_ecomobility_bookings_structure ON ecomobility_bookings(structure_id);
CREATE INDEX IF NOT EXISTS idx_ecomobility_bookings_customer ON ecomobility_bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_ecomobility_bookings_vehicle ON ecomobility_bookings(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_ecomobility_bookings_status ON ecomobility_bookings(structure_id, status);
CREATE INDEX IF NOT EXISTS idx_ecomobility_bookings_code ON ecomobility_bookings(booking_code);
CREATE INDEX IF NOT EXISTS idx_ecomobility_bookings_dates ON ecomobility_bookings(structure_id, pickup_date);
CREATE INDEX IF NOT EXISTS idx_ecomobility_logs_structure ON ecomobility_activity_logs(structure_id);
CREATE INDEX IF NOT EXISTS idx_ecomobility_logs_booking ON ecomobility_activity_logs(booking_id);
CREATE INDEX IF NOT EXISTS idx_ecomobility_notifications_structure ON ecomobility_notifications(structure_id);
CREATE INDEX IF NOT EXISTS idx_ecomobility_notifications_status ON ecomobility_notifications(status);
CREATE INDEX IF NOT EXISTS idx_ecomobility_maintenance_vehicle ON ecomobility_maintenance(vehicle_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE ecomobility_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecomobility_operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecomobility_vehicle_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecomobility_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecomobility_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecomobility_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecomobility_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecomobility_return_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecomobility_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecomobility_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecomobility_rental_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecomobility_maintenance ENABLE ROW LEVEL SECURITY;

-- Policy per service role (accesso completo a tutte le tabelle)
CREATE POLICY "Service role full access ecomobility_structures" ON ecomobility_structures FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access ecomobility_operators" ON ecomobility_operators FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access ecomobility_vehicle_types" ON ecomobility_vehicle_types FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access ecomobility_vehicles" ON ecomobility_vehicles FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access ecomobility_pricing" ON ecomobility_pricing FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access ecomobility_customers" ON ecomobility_customers FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access ecomobility_bookings" ON ecomobility_bookings FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access ecomobility_return_photos" ON ecomobility_return_photos FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access ecomobility_activity_logs" ON ecomobility_activity_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access ecomobility_notifications" ON ecomobility_notifications FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access ecomobility_rental_terms" ON ecomobility_rental_terms FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access ecomobility_maintenance" ON ecomobility_maintenance FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Policy per lettura pubblica (strutture attive e tipi veicoli)
CREATE POLICY "Public read active structures" ON ecomobility_structures FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "Public read vehicle types" ON ecomobility_vehicle_types FOR SELECT TO anon USING (true);
CREATE POLICY "Public read active pricing" ON ecomobility_pricing FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "Public read active terms" ON ecomobility_rental_terms FOR SELECT TO anon USING (is_active = true);

-- =====================================================
-- DATI INIZIALI
-- =====================================================

-- Tipi di veicoli standard
INSERT INTO ecomobility_vehicle_types (name, slug, description, category, requires_license_type, min_age) VALUES
('E-Bike City', 'ebike-city', 'Bicicletta elettrica da città', 'ebike', 'nessuna', 16),
('E-Bike MTB', 'ebike-mtb', 'Mountain bike elettrica', 'ebike', 'nessuna', 16),
('E-Bike Trekking', 'ebike-trekking', 'Bicicletta elettrica da trekking', 'ebike', 'nessuna', 16),
('Monopattino Elettrico', 'monopattino', 'Monopattino elettrico', 'monopattino', 'nessuna', 18),
('Scooter Elettrico 50cc', 'scooter-50', 'Scooter elettrico equivalente 50cc', 'scooter', 'AM', 14),
('Scooter Elettrico 125cc', 'scooter-125', 'Scooter elettrico equivalente 125cc', 'scooter', 'A1', 16)
ON CONFLICT DO NOTHING;

-- Prima struttura: Villa I Barronci
INSERT INTO ecomobility_structures (name, slug, description, city, province, country, email, is_active) VALUES
('Villa I Barronci', 'villa-barronci', 'Agriturismo di charme nel cuore del Chianti', 'San Casciano in Val di Pesa', 'FI', 'IT', 'info@villabarronci.it', true)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- COMMENTI
-- =====================================================

COMMENT ON TABLE ecomobility_structures IS 'Strutture turistiche (tenant) che usano 4bid Ecomobility';
COMMENT ON TABLE ecomobility_operators IS 'Operatori della struttura: admin, reception, manutentori';
COMMENT ON TABLE ecomobility_vehicle_types IS 'Tipologie di veicoli disponibili nel sistema';
COMMENT ON TABLE ecomobility_vehicles IS 'Veicoli specifici della flotta di ogni struttura';
COMMENT ON TABLE ecomobility_pricing IS 'Tariffe decrescenti per struttura e tipo veicolo';
COMMENT ON TABLE ecomobility_customers IS 'Clienti che noleggiano veicoli';
COMMENT ON TABLE ecomobility_bookings IS 'Prenotazioni e noleggi';
COMMENT ON TABLE ecomobility_return_photos IS 'Foto obbligatorie alla riconsegna del veicolo';
COMMENT ON TABLE ecomobility_activity_logs IS 'Log completo di tutte le operazioni';
COMMENT ON TABLE ecomobility_notifications IS 'Notifiche inviate a clienti e operatori';
COMMENT ON TABLE ecomobility_rental_terms IS 'Condizioni di noleggio personalizzabili per struttura';
COMMENT ON TABLE ecomobility_maintenance IS 'Registro manutenzioni veicoli';
