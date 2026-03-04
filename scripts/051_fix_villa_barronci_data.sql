-- Fix dati Villa I Barronci per renderla prenotabile

-- 1. Assicura che il veicolo abbia status e battery_status corretti
UPDATE ecomobility_vehicles 
SET 
  status = 'available',
  battery_level = COALESCE(battery_level, 100),
  battery_status = 'available'
WHERE structure_id IN (SELECT id FROM ecomobility_structures WHERE slug = 'villa-i-barronci');

-- 2. Assicura che ci sia almeno una tipologia veicolo
INSERT INTO ecomobility_vehicle_types (structure_id, name, description, icon, max_speed_kmh, avg_range_km, requires_license, max_passengers)
SELECT id, 'E-Bike City', 'Bicicletta elettrica da città, perfetta per esplorare i dintorni', 'bike', 25, 60, false, 1
FROM ecomobility_structures 
WHERE slug = 'villa-i-barronci'
ON CONFLICT DO NOTHING;

-- 3. Assicura che ci sia almeno una tariffa pricing
INSERT INTO ecomobility_pricing (structure_id, vehicle_type_id, hour_1, hour_2, hour_3, hour_4, hour_5, hour_6, hour_7, hour_8_plus, daily_cap, deposit, minimum_charge)
SELECT s.id, vt.id, 8.00, 7.00, 6.00, 5.00, 4.50, 4.00, 3.50, 3.00, 35.00, 50.00, 5.00
FROM ecomobility_structures s
JOIN ecomobility_vehicle_types vt ON vt.structure_id = s.id
WHERE s.slug = 'villa-i-barronci'
AND NOT EXISTS (
  SELECT 1 FROM ecomobility_pricing p WHERE p.structure_id = s.id AND p.vehicle_type_id = vt.id
);

-- 4. Assicura che ci sia almeno un veicolo
INSERT INTO ecomobility_vehicles (structure_id, vehicle_type_id, code, name, description, status, battery_level, battery_status)
SELECT s.id, vt.id, 'EB-001', 'E-Bike Rossa', 'E-bike city rossa con cestino anteriore', 'available', 100, 'available'
FROM ecomobility_structures s
JOIN ecomobility_vehicle_types vt ON vt.structure_id = s.id AND vt.name = 'E-Bike City'
WHERE s.slug = 'villa-i-barronci'
AND NOT EXISTS (
  SELECT 1 FROM ecomobility_vehicles v WHERE v.structure_id = s.id AND v.code = 'EB-001'
);

-- 5. Verifica risultati
SELECT 
  s.name as structure_name,
  s.slug,
  vt.name as vehicle_type,
  v.code as vehicle_code,
  v.status,
  v.battery_level,
  v.battery_status,
  p.hour_1,
  p.daily_cap,
  p.deposit
FROM ecomobility_structures s
LEFT JOIN ecomobility_vehicle_types vt ON vt.structure_id = s.id
LEFT JOIN ecomobility_vehicles v ON v.structure_id = s.id
LEFT JOIN ecomobility_pricing p ON p.structure_id = s.id AND p.vehicle_type_id = vt.id
WHERE s.slug = 'villa-i-barronci';
