-- Aggiunge campi per nuovi servizi e sottocategorie al business plan

-- SPA sottocategorie
ALTER TABLE business_plans ADD COLUMN IF NOT EXISTS spa_treatments_enabled BOOLEAN DEFAULT true;
ALTER TABLE business_plans ADD COLUMN IF NOT EXISTS spa_entries_enabled BOOLEAN DEFAULT true;

-- Piscina ingressi esterni  
ALTER TABLE business_plans ADD COLUMN IF NOT EXISTS pool_external_entries_enabled BOOLEAN DEFAULT false;

-- Noleggi (biciclette, auto, ecc)
ALTER TABLE business_plans ADD COLUMN IF NOT EXISTS has_rentals BOOLEAN DEFAULT false;
ALTER TABLE business_plans ADD COLUMN IF NOT EXISTS rentals_management TEXT DEFAULT 'direct' CHECK (rentals_management IN ('direct', 'rental'));
ALTER TABLE business_plans ADD COLUMN IF NOT EXISTS rentals_rental_fee DECIMAL(12,2) DEFAULT 0;
ALTER TABLE business_plans ADD COLUMN IF NOT EXISTS rentals_types TEXT[] DEFAULT '{}';

-- Servizi NCC
ALTER TABLE business_plans ADD COLUMN IF NOT EXISTS has_ncc BOOLEAN DEFAULT false;
ALTER TABLE business_plans ADD COLUMN IF NOT EXISTS ncc_management TEXT DEFAULT 'direct' CHECK (ncc_management IN ('direct', 'rental'));
ALTER TABLE business_plans ADD COLUMN IF NOT EXISTS ncc_rental_fee DECIMAL(12,2) DEFAULT 0;

-- Aggiunge campi finanziari per le nuove sottocategorie
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS spa_treatments_revenue DECIMAL(12,2) DEFAULT 0;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS spa_treatments_costs DECIMAL(12,2) DEFAULT 0;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS spa_entries_revenue DECIMAL(12,2) DEFAULT 0;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS spa_entries_costs DECIMAL(12,2) DEFAULT 0;

ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS pool_external_entries_revenue DECIMAL(12,2) DEFAULT 0;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS pool_external_entries_costs DECIMAL(12,2) DEFAULT 0;

ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS rentals_revenue DECIMAL(12,2) DEFAULT 0;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS rentals_costs DECIMAL(12,2) DEFAULT 0;

ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS ncc_revenue DECIMAL(12,2) DEFAULT 0;
ALTER TABLE business_plan_financials ADD COLUMN IF NOT EXISTS ncc_costs DECIMAL(12,2) DEFAULT 0;
