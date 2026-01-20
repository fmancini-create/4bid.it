-- Fix business_plan_photos area check constraint to include all areas

-- Drop the existing constraint
ALTER TABLE business_plan_photos DROP CONSTRAINT IF EXISTS business_plan_photos_area_check;

-- Add new constraint with all valid areas
ALTER TABLE business_plan_photos ADD CONSTRAINT business_plan_photos_area_check 
CHECK (area IN (
  'exterior',
  'lobby', 
  'room',
  'suite',
  'restaurant',
  'spa',
  'pool',
  'bar',
  'congress',
  'gym',
  'garden',
  'terrace',
  'rooftop',
  'beach',
  'parking',
  'reception',
  'lounge',
  'meeting_room',
  'bathroom',
  'kitchen',
  'other'
));
