-- Add missing staff cost columns (annual values) to business_plan_financials
-- These are used by the frontend for per-department staff costs

DO $$
BEGIN
  -- Staff costs by department (annual values)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_plan_financials' AND column_name = 'staff_rooms_cost') THEN
    ALTER TABLE business_plan_financials ADD COLUMN staff_rooms_cost NUMERIC DEFAULT 400000;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_plan_financials' AND column_name = 'staff_fb_cost') THEN
    ALTER TABLE business_plan_financials ADD COLUMN staff_fb_cost NUMERIC DEFAULT 300000;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_plan_financials' AND column_name = 'staff_spa_cost') THEN
    ALTER TABLE business_plan_financials ADD COLUMN staff_spa_cost NUMERIC DEFAULT 150000;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_plan_financials' AND column_name = 'staff_congress_cost') THEN
    ALTER TABLE business_plan_financials ADD COLUMN staff_congress_cost NUMERIC DEFAULT 100000;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_plan_financials' AND column_name = 'staff_admin_cost') THEN
    ALTER TABLE business_plan_financials ADD COLUMN staff_admin_cost NUMERIC DEFAULT 180000;
  END IF;
  
  -- Legacy fields for backward compatibility
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_plan_financials' AND column_name = 'depreciation') THEN
    ALTER TABLE business_plan_financials ADD COLUMN depreciation NUMERIC DEFAULT 150000;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_plan_financials' AND column_name = 'interest_cost') THEN
    ALTER TABLE business_plan_financials ADD COLUMN interest_cost NUMERIC DEFAULT 80000;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_plan_financials' AND column_name = 'rooms_cost_pct') THEN
    ALTER TABLE business_plan_financials ADD COLUMN rooms_cost_pct NUMERIC DEFAULT 25;
  END IF;
  
  -- Congress cost pct
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_plan_financials' AND column_name = 'congress_cost_pct') THEN
    ALTER TABLE business_plan_financials ADD COLUMN congress_cost_pct NUMERIC DEFAULT 45;
  END IF;
END
$$;
