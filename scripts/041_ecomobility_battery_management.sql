-- =====================================================
-- 4BID ECOMOBILITY - Gestione Batteria e Disponibilità
-- Integrazione stato carica come fattore vincolante
-- =====================================================

-- 1. Aggiunta campi batteria alla tabella veicoli
ALTER TABLE ecomobility_vehicles 
ADD COLUMN IF NOT EXISTS battery_status TEXT DEFAULT 'available' 
  CHECK (battery_status IN ('available', 'low_battery', 'charging', 'unavailable')),
ADD COLUMN IF NOT EXISTS last_battery_update TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS estimated_range_km INTEGER,
ADD COLUMN IF NOT EXISTS estimated_available_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS charge_start_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS full_charge_hours NUMERIC(4,2) DEFAULT 3;

-- 2. Aggiunta soglia minima batteria alla tabella strutture
ALTER TABLE ecomobility_structures
ADD COLUMN IF NOT EXISTS min_battery_threshold INTEGER DEFAULT 40,
ADD COLUMN IF NOT EXISTS default_charge_hours NUMERIC(4,2) DEFAULT 3;

-- 3. Aggiunta campi batteria alla tabella prenotazioni
ALTER TABLE ecomobility_bookings
ADD COLUMN IF NOT EXISTS battery_level_pickup INTEGER,
ADD COLUMN IF NOT EXISTS battery_level_return INTEGER,
ADD COLUMN IF NOT EXISTS battery_autonomy_accepted BOOLEAN DEFAULT false;

-- 4. Tabella storico batteria per analytics
CREATE TABLE IF NOT EXISTS ecomobility_battery_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES ecomobility_vehicles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES ecomobility_bookings(id) ON DELETE SET NULL,
  battery_level INTEGER NOT NULL CHECK (battery_level >= 0 AND battery_level <= 100),
  battery_status TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'pickup',        -- registrato al ritiro
    'return',        -- registrato alla riconsegna
    'charge_start',  -- inizio ricarica
    'charge_end',    -- fine ricarica
    'manual_update', -- aggiornamento manuale
    'maintenance'    -- durante manutenzione
  )),
  recorded_by TEXT, -- 'customer', 'operator', 'system'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_battery_history_vehicle ON ecomobility_battery_history(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_battery_history_created ON ecomobility_battery_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vehicles_battery_status ON ecomobility_vehicles(structure_id, battery_status);

-- RLS
ALTER TABLE ecomobility_battery_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access ecomobility_battery_history" 
ON ecomobility_battery_history 
FOR ALL TO service_role 
USING (true) WITH CHECK (true);

-- 5. Funzione per calcolare autonomia stimata
CREATE OR REPLACE FUNCTION calculate_estimated_range(
  p_battery_level INTEGER,
  p_max_range_km INTEGER
) RETURNS INTEGER AS $$
BEGIN
  RETURN ROUND((p_battery_level::NUMERIC / 100) * p_max_range_km);
END;
$$ LANGUAGE plpgsql;

-- 6. Funzione per calcolare tempo stimato a disponibilità
CREATE OR REPLACE FUNCTION calculate_estimated_available_time(
  p_battery_level INTEGER,
  p_min_threshold INTEGER,
  p_full_charge_hours NUMERIC
) RETURNS TIMESTAMPTZ AS $$
DECLARE
  charge_needed INTEGER;
  hours_needed NUMERIC;
BEGIN
  IF p_battery_level >= p_min_threshold THEN
    RETURN NOW();
  END IF;
  
  -- Calcola % da caricare per raggiungere soglia minima
  charge_needed := p_min_threshold - p_battery_level;
  -- Calcola ore necessarie (proporzionale)
  hours_needed := (charge_needed::NUMERIC / 100) * p_full_charge_hours;
  
  RETURN NOW() + (hours_needed * INTERVAL '1 hour');
END;
$$ LANGUAGE plpgsql;

-- 7. Trigger per aggiornare battery_status automaticamente
CREATE OR REPLACE FUNCTION update_vehicle_battery_status()
RETURNS TRIGGER AS $$
DECLARE
  min_threshold INTEGER;
BEGIN
  -- Recupera soglia minima della struttura
  SELECT COALESCE(min_battery_threshold, 40) INTO min_threshold
  FROM ecomobility_structures
  WHERE id = NEW.structure_id;
  
  -- Aggiorna battery_status in base al livello
  IF NEW.status = 'charging' OR NEW.battery_status = 'charging' THEN
    NEW.battery_status := 'charging';
  ELSIF NEW.battery_level IS NULL THEN
    NEW.battery_status := 'unavailable';
  ELSIF NEW.battery_level < min_threshold THEN
    NEW.battery_status := 'low_battery';
  ELSE
    NEW.battery_status := 'available';
  END IF;
  
  -- Aggiorna timestamp
  NEW.last_battery_update := NOW();
  
  -- Calcola autonomia stimata se abbiamo range del tipo veicolo
  IF NEW.battery_level IS NOT NULL AND NEW.vehicle_type_id IS NOT NULL THEN
    SELECT calculate_estimated_range(NEW.battery_level, COALESCE(vt.range_km, 50))
    INTO NEW.estimated_range_km
    FROM ecomobility_vehicle_types vt
    WHERE vt.id = NEW.vehicle_type_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_battery_status ON ecomobility_vehicles;
CREATE TRIGGER trigger_update_battery_status
BEFORE INSERT OR UPDATE OF battery_level, status
ON ecomobility_vehicles
FOR EACH ROW
EXECUTE FUNCTION update_vehicle_battery_status();

-- 8. Commenti
COMMENT ON COLUMN ecomobility_vehicles.battery_status IS 'Stato batteria: available, low_battery, charging, unavailable';
COMMENT ON COLUMN ecomobility_vehicles.last_battery_update IS 'Ultimo aggiornamento livello batteria';
COMMENT ON COLUMN ecomobility_vehicles.estimated_range_km IS 'Autonomia stimata in km';
COMMENT ON COLUMN ecomobility_vehicles.estimated_available_time IS 'Tempo stimato a disponibilità (se in carica)';
COMMENT ON COLUMN ecomobility_vehicles.charge_start_time IS 'Inizio ricarica';
COMMENT ON COLUMN ecomobility_vehicles.full_charge_hours IS 'Ore per carica completa (default 3)';
COMMENT ON COLUMN ecomobility_structures.min_battery_threshold IS 'Soglia minima batteria per prenotazione (%)';
COMMENT ON COLUMN ecomobility_structures.default_charge_hours IS 'Ore default per carica completa';
COMMENT ON COLUMN ecomobility_bookings.battery_level_pickup IS 'Livello batteria al ritiro';
COMMENT ON COLUMN ecomobility_bookings.battery_level_return IS 'Livello batteria alla riconsegna';
COMMENT ON TABLE ecomobility_battery_history IS 'Storico livelli batteria per analytics';

-- 9. Aggiorna veicoli esistenti con valori default
UPDATE ecomobility_vehicles
SET 
  battery_status = CASE 
    WHEN battery_level IS NULL THEN 'unavailable'
    WHEN battery_level < 40 THEN 'low_battery'
    WHEN status = 'charging' THEN 'charging'
    ELSE 'available'
  END,
  last_battery_update = NOW(),
  full_charge_hours = 3
WHERE battery_status IS NULL;
