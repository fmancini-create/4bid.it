-- Create PostgreSQL functions to increment views and conversions atomically

-- Function to increment views
CREATE OR REPLACE FUNCTION increment_landing_page_views(page_slug TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE landing_pages 
  SET views = COALESCE(views, 0) + 1,
      updated_at = NOW()
  WHERE slug = page_slug;
END;
$$;

-- Function to increment conversions
CREATE OR REPLACE FUNCTION increment_landing_page_conversions(page_slug TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE landing_pages 
  SET conversions = COALESCE(conversions, 0) + 1,
      updated_at = NOW()
  WHERE slug = page_slug;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION increment_landing_page_views(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_landing_page_conversions(TEXT) TO anon, authenticated;
