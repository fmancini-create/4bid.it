-- Create the increment views function
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

-- Create the increment conversions function
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
