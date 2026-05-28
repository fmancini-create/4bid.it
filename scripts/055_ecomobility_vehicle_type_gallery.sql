-- Add multi-image gallery support to vehicle types.
-- image_url remains the "cover" (first image) for backward compatibility.
ALTER TABLE ecomobility_vehicle_types
  ADD COLUMN IF NOT EXISTS image_urls jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Backfill: any existing single image_url becomes the first gallery item.
UPDATE ecomobility_vehicle_types
SET image_urls = jsonb_build_array(image_url)
WHERE image_url IS NOT NULL
  AND (image_urls IS NULL OR image_urls = '[]'::jsonb);
