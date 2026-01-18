-- Tabelle per gestione disponibilità e orari strutture
-- 4BID Ecomobility

-- 1. Orari di apertura settimanali
CREATE TABLE IF NOT EXISTS ecomobility_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  structure_id UUID NOT NULL REFERENCES ecomobility_structures(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=domenica, 6=sabato
  is_open BOOLEAN DEFAULT true,
  open_time TIME,
  close_time TIME,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(structure_id, day_of_week)
);

-- 2. Blocchi date/fasce specifiche (chiusure straordinarie, manutenzione)
CREATE TABLE IF NOT EXISTS ecomobility_blocked_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  structure_id UUID NOT NULL REFERENCES ecomobility_structures(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME, -- null se all_day = true
  end_time TIME,   -- null se all_day = true
  all_day BOOLEAN DEFAULT false,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_eco_schedule_structure ON ecomobility_schedule(structure_id);
CREATE INDEX IF NOT EXISTS idx_eco_blocked_structure_date ON ecomobility_blocked_slots(structure_id, date);

-- RLS
ALTER TABLE ecomobility_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecomobility_blocked_slots ENABLE ROW LEVEL SECURITY;

-- Policy
CREATE POLICY "Service role full access ecomobility_schedule" ON ecomobility_schedule FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access ecomobility_blocked_slots" ON ecomobility_blocked_slots FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access ecomobility_schedule" ON ecomobility_schedule FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access ecomobility_blocked_slots" ON ecomobility_blocked_slots FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Inserisci orari default per Villa I Barronci (aperti tutti i giorni 08:00-20:00)
INSERT INTO ecomobility_schedule (structure_id, day_of_week, is_open, open_time, close_time)
SELECT 
  id as structure_id,
  generate_series(0, 6) as day_of_week,
  true as is_open,
  '08:00'::TIME as open_time,
  '20:00'::TIME as close_time
FROM ecomobility_structures 
WHERE slug = 'villa-i-barronci'
ON CONFLICT (structure_id, day_of_week) DO NOTHING;

-- Aggiungi colonne requires_license e max_passengers a vehicle_types se non esistono
ALTER TABLE ecomobility_vehicle_types ADD COLUMN IF NOT EXISTS requires_license BOOLEAN DEFAULT false;
ALTER TABLE ecomobility_vehicle_types ADD COLUMN IF NOT EXISTS max_passengers INTEGER DEFAULT 1;

-- Aggiungi colonne brand e model a vehicles se non esistono
ALTER TABLE ecomobility_vehicles ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE ecomobility_vehicles ADD COLUMN IF NOT EXISTS model TEXT;
ALTER TABLE ecomobility_vehicles ADD COLUMN IF NOT EXISTS notes TEXT;
