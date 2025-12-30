-- Enable RLS on contacts table (currently disabled - SECURITY RISK)
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public can insert contacts" ON contacts;
DROP POLICY IF EXISTS "Authenticated can read contacts" ON contacts;
DROP POLICY IF EXISTS "Authenticated can update contacts" ON contacts;

-- Recreate policies with proper security
-- Anyone can submit a contact (public insert)
CREATE POLICY "Public can insert contacts" ON contacts
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Only authenticated users can read contacts
CREATE POLICY "Authenticated can read contacts" ON contacts
  FOR SELECT
  TO authenticated
  USING (true);

-- Only authenticated users can update contacts
CREATE POLICY "Authenticated can update contacts" ON contacts
  FOR UPDATE
  TO authenticated
  USING (true);
