-- Fix business_plan_photos area check constraint

-- First, drop the existing constraint
ALTER TABLE business_plan_photos DROP CONSTRAINT IF EXISTS business_plan_photos_area_check;

-- Update any invalid area values to 'other'
UPDATE business_plan_photos 
SET area = 'other' 
WHERE area NOT IN (
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
);

-- Now add the new constraint with all valid areas
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
