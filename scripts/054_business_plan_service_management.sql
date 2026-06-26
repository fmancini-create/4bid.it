-- Aggiungi colonne per gestione servizi (diretta/affitto) e nuovi centri di ricavo

-- Gestione per servizi esistenti
ALTER TABLE business_plans ADD COLUMN IF NOT EXISTS spa_management TEXT DEFAULT 'direct';
ALTER TABLE business_plans ADD COLUMN IF NOT EXISTS spa_rental_fee DECIMAL(12,2) DEFAULT 0;
ALTER TABLE business_plans ADD COLUMN IF NOT EXISTS restaurant_management TEXT DEFAULT 'direct';
ALTER TABLE business_plans ADD COLUMN IF NOT EXISTS restaurant_rental_fee DECIMAL(12,2) DEFAULT 0;
ALTER TABLE business_plans ADD COLUMN IF NOT EXISTS congress_management TEXT DEFAULT 'direct';
ALTER TABLE business_plans ADD COLUMN IF NOT EXISTS congress_rental_fee DECIMAL(12,2) DEFAULT 0;

-- Nuovi centri di ricavo
ALTER TABLE business_plans ADD COLUMN IF NOT EXISTS has_bar BOOLEAN DEFAULT false;
ALTER TABLE business_plans ADD COLUMN IF NOT EXISTS bar_management TEXT DEFAULT 'direct';
ALTER TABLE business_plans ADD COLUMN IF NOT EXISTS bar_rental_fee DECIMAL(12,2) DEFAULT 0;

ALTER TABLE business_plans ADD COLUMN IF NOT EXISTS has_bistrot BOOLEAN DEFAULT false;
ALTER TABLE business_plans ADD COLUMN IF NOT EXISTS bistrot_management TEXT DEFAULT 'direct';
ALTER TABLE business_plans ADD COLUMN IF NOT EXISTS bistrot_rental_fee DECIMAL(12,2) DEFAULT 0;

ALTER TABLE business_plans ADD COLUMN IF NOT EXISTS has_gym BOOLEAN DEFAULT false;
ALTER TABLE business_plans ADD COLUMN IF NOT EXISTS gym_management TEXT DEFAULT 'direct';
ALTER TABLE business_plans ADD COLUMN IF NOT EXISTS gym_rental_fee DECIMAL(12,2) DEFAULT 0;

ALTER TABLE business_plans ADD COLUMN IF NOT EXISTS has_pool BOOLEAN DEFAULT false;
ALTER TABLE business_plans ADD COLUMN IF NOT EXISTS pool_management TEXT DEFAULT 'direct';
ALTER TABLE business_plans ADD COLUMN IF NOT EXISTS pool_rental_fee DECIMAL(12,2) DEFAULT 0;

ALTER TABLE business_plans ADD COLUMN IF NOT EXISTS has_parking BOOLEAN DEFAULT false;
ALTER TABLE business_plans ADD COLUMN IF NOT EXISTS parking_management TEXT DEFAULT 'direct';
ALTER TABLE business_plans ADD COLUMN IF NOT EXISTS parking_rental_fee DECIMAL(12,2) DEFAULT 0;

ALTER TABLE business_plans ADD COLUMN IF NOT EXISTS has_laundry BOOLEAN DEFAULT false;
ALTER TABLE business_plans ADD COLUMN IF NOT EXISTS laundry_management TEXT DEFAULT 'direct';
ALTER TABLE business_plans ADD COLUMN IF NOT EXISTS laundry_rental_fee DECIMAL(12,2) DEFAULT 0;

-- Aggiungi anche ricavi % per i nuovi servizi nella tabella financials
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS bar_revenue_pct DECIMAL(5,2) DEFAULT 0;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS bar_cost_pct DECIMAL(5,2) DEFAULT 30;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS bistrot_revenue_pct DECIMAL(5,2) DEFAULT 0;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS bistrot_cost_pct DECIMAL(5,2) DEFAULT 35;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS gym_revenue_pct DECIMAL(5,2) DEFAULT 0;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS gym_cost_pct DECIMAL(5,2) DEFAULT 25;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS pool_revenue_pct DECIMAL(5,2) DEFAULT 0;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS pool_cost_pct DECIMAL(5,2) DEFAULT 20;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS parking_revenue_pct DECIMAL(5,2) DEFAULT 0;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS parking_cost_pct DECIMAL(5,2) DEFAULT 15;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS laundry_revenue_pct DECIMAL(5,2) DEFAULT 0;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS laundry_cost_pct DECIMAL(5,2) DEFAULT 40;

-- Costi personale per i nuovi servizi
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS staff_bar_cost DECIMAL(12,2) DEFAULT 0;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS staff_bistrot_cost DECIMAL(12,2) DEFAULT 0;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS staff_gym_cost DECIMAL(12,2) DEFAULT 0;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS staff_pool_cost DECIMAL(12,2) DEFAULT 0;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS staff_parking_cost DECIMAL(12,2) DEFAULT 0;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS staff_laundry_cost DECIMAL(12,2) DEFAULT 0;
