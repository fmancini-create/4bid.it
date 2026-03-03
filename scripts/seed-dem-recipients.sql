-- First, find the most recent campaign
SELECT id, name, subject, status, created_at FROM dem_campaigns ORDER BY created_at DESC LIMIT 5;
