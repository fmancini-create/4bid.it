-- Add image_url column to social_posts table
ALTER TABLE social_posts 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN social_posts.image_url IS 'URL of AI-generated or uploaded image for the post';
