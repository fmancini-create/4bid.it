-- Aggiungi colonna media_priority alla tabella social_posts
-- Permette di scegliere se dare priorità all'immagine o all'anteprima del link

ALTER TABLE social_posts 
ADD COLUMN IF NOT EXISTS media_priority TEXT DEFAULT 'image' 
CHECK (media_priority IN ('image', 'link'));

COMMENT ON COLUMN social_posts.media_priority IS 'Priorità media: image = usa immagine caricata, link = mostra anteprima link';
