-- Aggiungi colonne mancanti alla tabella ecomobility_customers

ALTER TABLE ecomobility_customers 
ADD COLUMN IF NOT EXISTS date_of_birth DATE;

ALTER TABLE ecomobility_customers 
ADD COLUMN IF NOT EXISTS nationality TEXT DEFAULT 'IT';

ALTER TABLE ecomobility_customers 
ADD COLUMN IF NOT EXISTS license_type TEXT;

ALTER TABLE ecomobility_customers 
ADD COLUMN IF NOT EXISTS license_number TEXT;

ALTER TABLE ecomobility_customers 
ADD COLUMN IF NOT EXISTS license_expiry DATE;

ALTER TABLE ecomobility_customers 
ADD COLUMN IF NOT EXISTS documents_status TEXT DEFAULT 'pending';

ALTER TABLE ecomobility_customers 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
