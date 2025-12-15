-- Remove duplicate landing page entries with incorrect slugs
-- Keep only the correct slugs that match the actual page URLs

-- Remove the incorrect bed-and-breakfast entry (keep bed-breakfast)
DELETE FROM landing_pages 
WHERE slug = 'revenue-management-bed-and-breakfast';

-- Remove the incorrect agriturismi entry (keep agriturismo)
DELETE FROM landing_pages 
WHERE slug = 'revenue-management-agriturismi';

-- Remove the incorrect yield-management-camere-hotel entry (keep yield-management-hotel)
DELETE FROM landing_pages 
WHERE slug = 'yield-management-camere-hotel';

-- Verify remaining entries
SELECT slug, title, views, conversions 
FROM landing_pages 
WHERE slug IN (
  'revenue-management-bed-breakfast',
  'revenue-management-agriturismo', 
  'yield-management-hotel'
)
ORDER BY slug;
