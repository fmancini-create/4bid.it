-- Add revenue calculation modes and detailed parameters to business_plan_financials

-- Revenue modes for each service
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS fb_revenue_mode TEXT DEFAULT 'pct_rooms';
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS fb_revenue_absolute DECIMAL(15,2) DEFAULT 0;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS fb_internal_pct DECIMAL(5,2) DEFAULT 60;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS fb_internal_avg_spend DECIMAL(10,2) DEFAULT 45;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS fb_external_covers INTEGER DEFAULT 2000;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS fb_external_avg_spend DECIMAL(10,2) DEFAULT 55;

ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS spa_revenue_mode TEXT DEFAULT 'pct_rooms';
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS spa_revenue_absolute DECIMAL(15,2) DEFAULT 0;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS spa_treatments_internal_pct DECIMAL(5,2) DEFAULT 15;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS spa_treatments_internal_avg DECIMAL(10,2) DEFAULT 80;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS spa_treatments_external_clients INTEGER DEFAULT 500;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS spa_treatments_external_avg DECIMAL(10,2) DEFAULT 90;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS spa_entries_internal_pct DECIMAL(5,2) DEFAULT 25;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS spa_entries_internal_avg DECIMAL(10,2) DEFAULT 25;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS spa_entries_external_clients INTEGER DEFAULT 1000;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS spa_entries_external_avg DECIMAL(10,2) DEFAULT 30;

ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS congress_revenue_mode TEXT DEFAULT 'pct_rooms';
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS congress_revenue_absolute DECIMAL(15,2) DEFAULT 0;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS congress_events_year INTEGER DEFAULT 50;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS congress_avg_revenue DECIMAL(10,2) DEFAULT 3000;

ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS bar_revenue_mode TEXT DEFAULT 'pct_rooms';
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS bar_revenue_absolute DECIMAL(15,2) DEFAULT 0;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS bar_internal_pct DECIMAL(5,2) DEFAULT 40;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS bar_internal_avg_spend DECIMAL(10,2) DEFAULT 15;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS bar_external_clients INTEGER DEFAULT 3000;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS bar_external_avg_spend DECIMAL(10,2) DEFAULT 18;

ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS bistrot_revenue_mode TEXT DEFAULT 'pct_rooms';
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS bistrot_revenue_absolute DECIMAL(15,2) DEFAULT 0;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS bistrot_internal_pct DECIMAL(5,2) DEFAULT 20;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS bistrot_internal_avg_spend DECIMAL(10,2) DEFAULT 25;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS bistrot_external_clients INTEGER DEFAULT 1500;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS bistrot_external_avg_spend DECIMAL(10,2) DEFAULT 30;

ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS gym_revenue_mode TEXT DEFAULT 'pct_rooms';
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS gym_revenue_absolute DECIMAL(15,2) DEFAULT 0;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS gym_internal_pct DECIMAL(5,2) DEFAULT 10;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS gym_internal_avg DECIMAL(10,2) DEFAULT 10;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS gym_external_clients INTEGER DEFAULT 500;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS gym_external_avg DECIMAL(10,2) DEFAULT 15;

ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS pool_revenue_mode TEXT DEFAULT 'pct_rooms';
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS pool_revenue_absolute DECIMAL(15,2) DEFAULT 0;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS pool_external_entries INTEGER DEFAULT 2000;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS pool_external_avg DECIMAL(10,2) DEFAULT 20;

ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS parking_revenue_mode TEXT DEFAULT 'pct_rooms';
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS parking_revenue_absolute DECIMAL(15,2) DEFAULT 0;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS parking_internal_pct DECIMAL(5,2) DEFAULT 30;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS parking_internal_avg DECIMAL(10,2) DEFAULT 15;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS parking_external_spaces INTEGER DEFAULT 20;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS parking_external_days INTEGER DEFAULT 200;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS parking_external_avg DECIMAL(10,2) DEFAULT 10;

ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS laundry_revenue_mode TEXT DEFAULT 'pct_rooms';
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS laundry_revenue_absolute DECIMAL(15,2) DEFAULT 0;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS laundry_internal_pct DECIMAL(5,2) DEFAULT 8;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS laundry_internal_avg DECIMAL(10,2) DEFAULT 20;

ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS rentals_revenue_mode TEXT DEFAULT 'pct_rooms';
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS rentals_revenue_absolute DECIMAL(15,2) DEFAULT 0;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS rentals_internal_pct DECIMAL(5,2) DEFAULT 15;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS rentals_internal_avg DECIMAL(10,2) DEFAULT 35;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS rentals_external_clients INTEGER DEFAULT 800;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS rentals_external_avg DECIMAL(10,2) DEFAULT 40;

ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS ncc_revenue_mode TEXT DEFAULT 'pct_rooms';
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS ncc_revenue_absolute DECIMAL(15,2) DEFAULT 0;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS ncc_internal_pct DECIMAL(5,2) DEFAULT 5;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS ncc_internal_avg DECIMAL(10,2) DEFAULT 80;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS ncc_external_trips INTEGER DEFAULT 300;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS ncc_external_avg DECIMAL(10,2) DEFAULT 100;
