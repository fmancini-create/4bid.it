-- Fix Villa I Barronci data - solo UPDATE, no INSERT

-- 1. Aggiorna tutti i veicoli esistenti con status e battery corretti
UPDATE ecomobility_vehicles
SET 
  status = 'available',
  battery_status = 'available',
  battery_level = COALESCE(battery_level, 85)
WHERE structure_id = (SELECT id FROM ecomobility_structures WHERE slug = 'villa-i-barronci');

-- 2. Verifica se esiste almeno una tipologia, altrimenti la crea
INSERT INTO ecomobility_vehicle_types (structure_id, name, description, icon, max_speed_kmh, avg_range_km, requires_license, max_passengers)
SELECT 
  s.id,
  'E-Bike City',
  'Bicicletta elettrica per escursioni in città e campagna',
  'bike',
  25,
  60,
  false,
  1
FROM ecomobility_structures s
WHERE s.slug = 'villa-i-barronci'
AND NOT EXISTS (
  SELECT 1 FROM ecomobility_vehicle_types vt WHERE vt.structure_id = s.id
);

-- 3. Assicura che ogni tipologia abbia una tariffa
INSERT INTO ecomobility_pricing (structure_id, vehicle_type_id, hour_1, hour_2, hour_3, hour_4, hour_5, hour_6, hour_7, hour_8_plus, daily_cap, deposit, minimum_charge)
SELECT 
  vt.structure_id,
  vt.id,
  8,   -- 1a ora
  6,   -- 2a ora
  5,   -- 3a ora
  4,   -- 4a ora
  3,   -- 5a ora
  3,   -- 6a ora
  2,   -- 7a ora
  2,   -- 8+ ore
  35,  -- max giornaliero
  50,  -- cauzione
  8    -- minimo
FROM ecomobility_vehicle_types vt
JOIN ecomobility_structures s ON s.id = vt.structure_id
WHERE s.slug = 'villa-i-barronci'
AND NOT EXISTS (
  SELECT 1 FROM ecomobility_pricing p WHERE p.vehicle_type_id = vt.id
);

-- 4. Se non ci sono veicoli, creane uno di esempio
INSERT INTO ecomobility_vehicles (structure_id, vehicle_type_id, code, name, brand, model, status, battery_level, battery_status)
SELECT 
  s.id,
  vt.id,
  'EBIKE-001',
  'E-Bike City 1',
  'Bianchi',
  'E-City',
  'available',
  90,
  'available'
FROM ecomobility_structures s
JOIN ecomobility_vehicle_types vt ON vt.structure_id = s.id
WHERE s.slug = 'villa-i-barronci'
AND NOT EXISTS (
  SELECT 1 FROM ecomobility_vehicles v WHERE v.structure_id = s.id
)
LIMIT 1;
