-- Aggiunge il constraint unico su business_plan_id e year per business_plan_financials
-- Questo permette l'upsert basato su anno

-- Prima rimuove eventuali duplicati (mantiene il record più recente)
DELETE FROM business_plan_financials a
USING business_plan_financials b
WHERE a.business_plan_id = b.business_plan_id 
  AND a.year = b.year 
  AND a.created_at < b.created_at;

-- Aggiunge il constraint unico
ALTER TABLE business_plan_financials 
DROP CONSTRAINT IF EXISTS business_plan_financials_plan_year_unique;

ALTER TABLE business_plan_financials 
ADD CONSTRAINT business_plan_financials_plan_year_unique 
UNIQUE (business_plan_id, year);
