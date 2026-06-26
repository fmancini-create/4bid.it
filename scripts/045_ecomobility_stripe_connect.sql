-- Aggiungi campi Stripe Connect alla tabella strutture
ALTER TABLE ecomobility_structures 
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT false;

-- Aggiungi campo payment intent alle prenotazioni
ALTER TABLE ecomobility_bookings
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

-- Indice per cercare strutture per account Stripe
CREATE INDEX IF NOT EXISTS idx_eco_structures_stripe ON ecomobility_structures(stripe_account_id);

COMMENT ON COLUMN ecomobility_structures.stripe_account_id IS 'ID account Stripe Connect della struttura';
COMMENT ON COLUMN ecomobility_structures.stripe_onboarding_complete IS 'True se la struttura ha completato onboarding Stripe';
