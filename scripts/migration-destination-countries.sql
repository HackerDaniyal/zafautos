-- Migration: Create vehicle_destination_countries junction table
-- This enables many-to-many relationship between vehicles and destination countries.

CREATE TABLE IF NOT EXISTS vehicle_destination_countries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(vehicle_id, country_id)
);

CREATE INDEX IF NOT EXISTS vdc_vehicle_idx ON vehicle_destination_countries(vehicle_id);
CREATE INDEX IF NOT EXISTS vdc_country_idx ON vehicle_destination_countries(country_id);

-- Seed: Assign all active vehicles to Australia, New Zealand, Pakistan, Myanmar, Bahrain
INSERT INTO vehicle_destination_countries (vehicle_id, country_id)
SELECT v.id, c.id
FROM vehicles v
CROSS JOIN countries c
WHERE v.deleted_at IS NULL
  AND c.name IN ('Australia', 'New Zealand', 'Pakistan', 'Myanmar', 'Bahrain')
ON CONFLICT (vehicle_id, country_id) DO NOTHING;
