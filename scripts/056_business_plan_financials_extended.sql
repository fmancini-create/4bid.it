-- Aggiunge le colonne finanziarie estese per tutti i nuovi centri di ricavo/costo
-- alla tabella business_plan_financials

-- RICAVI percentuali per nuovi servizi
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS spa_treatments_revenue_pct DECIMAL(5,2) DEFAULT 8;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS spa_entries_revenue_pct DECIMAL(5,2) DEFAULT 4;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS bar_revenue_pct DECIMAL(5,2) DEFAULT 8;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS bistrot_revenue_pct DECIMAL(5,2) DEFAULT 5;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS gym_revenue_pct DECIMAL(5,2) DEFAULT 3;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS pool_revenue_pct DECIMAL(5,2) DEFAULT 2;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS pool_external_revenue_pct DECIMAL(5,2) DEFAULT 3;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS parking_revenue_pct DECIMAL(5,2) DEFAULT 4;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS laundry_revenue_pct DECIMAL(5,2) DEFAULT 2;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS rentals_revenue_pct DECIMAL(5,2) DEFAULT 5;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS ncc_revenue_pct DECIMAL(5,2) DEFAULT 4;

-- CANONI DA AFFITTO (importi fissi annuali)
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS spa_rental_income DECIMAL(12,2) DEFAULT 0;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS restaurant_rental_income DECIMAL(12,2) DEFAULT 0;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS congress_rental_income DECIMAL(12,2) DEFAULT 0;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS bar_rental_income DECIMAL(12,2) DEFAULT 0;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS bistrot_rental_income DECIMAL(12,2) DEFAULT 0;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS gym_rental_income DECIMAL(12,2) DEFAULT 0;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS pool_rental_income DECIMAL(12,2) DEFAULT 0;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS parking_rental_income DECIMAL(12,2) DEFAULT 0;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS laundry_rental_income DECIMAL(12,2) DEFAULT 0;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS rentals_rental_income DECIMAL(12,2) DEFAULT 0;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS ncc_rental_income DECIMAL(12,2) DEFAULT 0;

-- COSTI VARIABILI percentuali per nuovi servizi
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS spa_treatments_cost_pct DECIMAL(5,2) DEFAULT 45;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS spa_entries_cost_pct DECIMAL(5,2) DEFAULT 25;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS bar_cost_pct DECIMAL(5,2) DEFAULT 30;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS bistrot_cost_pct DECIMAL(5,2) DEFAULT 35;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS gym_cost_pct DECIMAL(5,2) DEFAULT 20;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS pool_cost_pct DECIMAL(5,2) DEFAULT 25;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS pool_external_cost_pct DECIMAL(5,2) DEFAULT 25;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS parking_cost_pct DECIMAL(5,2) DEFAULT 15;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS laundry_cost_pct DECIMAL(5,2) DEFAULT 40;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS rentals_cost_pct DECIMAL(5,2) DEFAULT 25;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS ncc_cost_pct DECIMAL(5,2) DEFAULT 55;

-- COSTI PERSONALE per nuovi reparti
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS staff_bar_cost DECIMAL(12,2) DEFAULT 50000;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS staff_bistrot_cost DECIMAL(12,2) DEFAULT 40000;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS staff_gym_cost DECIMAL(12,2) DEFAULT 30000;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS staff_pool_cost DECIMAL(12,2) DEFAULT 25000;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS staff_parking_cost DECIMAL(12,2) DEFAULT 20000;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS staff_laundry_cost DECIMAL(12,2) DEFAULT 35000;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS staff_rentals_cost DECIMAL(12,2) DEFAULT 40000;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS staff_ncc_cost DECIMAL(12,2) DEFAULT 60000;
