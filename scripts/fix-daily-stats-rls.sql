-- Fix RLS policies for landing_page_daily_stats table
-- This allows the service_role to insert daily snapshots via cron

-- Remove existing policies
DROP POLICY IF EXISTS "Authenticated can insert daily stats" ON landing_page_daily_stats;
DROP POLICY IF EXISTS "Authenticated can view daily stats" ON landing_page_daily_stats;
DROP POLICY IF EXISTS "Service role full access to daily stats" ON landing_page_daily_stats;

-- Create policy for service_role (full access for cron jobs)
CREATE POLICY "Service role full access to daily stats" 
ON landing_page_daily_stats 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Create policy for authenticated users (read only)
CREATE POLICY "Authenticated can view daily stats" 
ON landing_page_daily_stats 
FOR SELECT 
TO authenticated
USING (true);
