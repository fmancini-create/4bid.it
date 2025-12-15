-- Add launch_date column to landing_pages table
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS launch_date DATE DEFAULT '2025-12-15';

-- Set launch date to December 15, 2025 for all existing landing pages
UPDATE landing_pages SET launch_date = '2025-12-15' WHERE launch_date IS NULL;
