-- Migration 056: Balin.app tracker integration
-- Estende ecomobility_devices con campi specifici Balin e ecomobility_bookings con link condivisione.

-- DEVICES: campi tracker Balin
ALTER TABLE ecomobility_devices
  ADD COLUMN IF NOT EXISTS imei TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'balin',
  ADD COLUMN IF NOT EXISTS is_moving BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_connected BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS odometer_km NUMERIC,
  ADD COLUMN IF NOT EXISTS last_event_type INTEGER,
  ADD COLUMN IF NOT EXISTS last_speed_kmh NUMERIC,
  ADD COLUMN IF NOT EXISTS battery_voltage NUMERIC,
  ADD COLUMN IF NOT EXISTS device_battery_voltage NUMERIC,
  ADD COLUMN IF NOT EXISTS last_position_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS last_sync_error TEXT,
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_ecomobility_devices_imei ON ecomobility_devices(imei);
CREATE INDEX IF NOT EXISTS idx_ecomobility_devices_vehicle ON ecomobility_devices(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_ecomobility_devices_structure ON ecomobility_devices(structure_id);

-- DEVICE LOCATIONS: campi addizionali per riconciliazione
ALTER TABLE ecomobility_device_locations
  ADD COLUMN IF NOT EXISTS heading NUMERIC,
  ADD COLUMN IF NOT EXISTS event_type INTEGER,
  ADD COLUMN IF NOT EXISTS battery_voltage NUMERIC,
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'balin';

CREATE INDEX IF NOT EXISTS idx_device_locations_device_recorded
  ON ecomobility_device_locations(device_id, recorded_at DESC);

-- BOOKINGS: link condivisione tracker
ALTER TABLE ecomobility_bookings
  ADD COLUMN IF NOT EXISTS tracker_share_url TEXT,
  ADD COLUMN IF NOT EXISTS tracker_share_id TEXT,
  ADD COLUMN IF NOT EXISTS tracker_share_expires_at TIMESTAMP WITH TIME ZONE;
