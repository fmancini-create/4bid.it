-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can submit contact form" ON contacts;
DROP POLICY IF EXISTS "Authenticated users can read contacts" ON contacts;
DROP POLICY IF EXISTS "Authenticated users can update contacts" ON contacts;

-- Recreate policy to allow public inserts (for contact form)
CREATE POLICY "Public can insert contacts"
  ON contacts
  FOR INSERT
  WITH CHECK (true);

-- Policy for authenticated users to read
CREATE POLICY "Authenticated can read contacts"
  ON contacts
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for authenticated users to update
CREATE POLICY "Authenticated can update contacts"
  ON contacts
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
