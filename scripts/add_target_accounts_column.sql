-- Aggiungi colonna target_accounts alla tabella social_posts
ALTER TABLE social_posts 
ADD COLUMN IF NOT EXISTS target_accounts text[] DEFAULT NULL;

-- Commento per documentazione
COMMENT ON COLUMN social_posts.target_accounts IS 'Array di ID degli account social target per la pubblicazione. Se NULL, pubblica su tutti gli account attivi della piattaforma.';
