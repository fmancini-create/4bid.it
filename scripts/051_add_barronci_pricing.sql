-- Aggiungi tariffe per Villa I Barronci se mancanti
-- Prima verifichiamo se esistono vehicle_types per la struttura

-- Inserisci pricing per ogni vehicle_type esistente che non ha pricing
INSERT INTO ecomobility_pricing (
  structure_id,
  vehicle_type_id,
  hour_1,
  hour_2,
  hour_3,
  hour_4,
  hour_5,
  hour_6,
  hour_7,
  hour_8_plus,
  daily_cap,
  minimum_charge,
  deposit
)
SELECT 
  vt.structure_id,
  vt.id,
  15.00, -- 1a ora
  12.00, -- 2a ora  
  10.00, -- 3a ora
  8.00,  -- 4a ora
  7.00,  -- 5a ora
  6.00,  -- 6a ora
  5.00,  -- 7a ora
  4.00,  -- 8a+ ora
  50.00, -- max giornaliero
  15.00, -- minimo
  100.00 -- cauzione
FROM ecomobility_vehicle_types vt
WHERE vt.structure_id = (SELECT id FROM ecomobility_structures WHERE slug = 'villa-i-barronci')
AND NOT EXISTS (
  SELECT 1 FROM ecomobility_pricing p 
  WHERE p.vehicle_type_id = vt.id
);

-- Aggiorna i veicoli per avere battery_level e status corretti
UPDATE ecomobility_vehicles
SET 
  battery_level = COALESCE(battery_level, 85),
  battery_status = COALESCE(battery_status, 'available'),
  status = COALESCE(status, 'available')
WHERE structure_id = (SELECT id FROM ecomobility_structures WHERE slug = 'villa-i-barronci');

-- Verifica risultati
SELECT 'Veicoli:' as tipo, COUNT(*) as count FROM ecomobility_vehicles 
WHERE structure_id = (SELECT id FROM ecomobility_structures WHERE slug = 'villa-i-barronci')
UNION ALL
SELECT 'Tipi veicolo:' as tipo, COUNT(*) as count FROM ecomobility_vehicle_types 
WHERE structure_id = (SELECT id FROM ecomobility_structures WHERE slug = 'villa-i-barronci')
UNION ALL
SELECT 'Tariffe:' as tipo, COUNT(*) as count FROM ecomobility_pricing 
WHERE structure_id = (SELECT id FROM ecomobility_structures WHERE slug = 'villa-i-barronci');
