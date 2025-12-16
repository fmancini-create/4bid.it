-- Create contacts table to store all contact form submissions
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  read BOOLEAN DEFAULT FALSE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_read ON contacts(read);

-- Enable Row Level Security (RLS)
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone to insert (public form submissions)
CREATE POLICY "Anyone can submit contact form" ON contacts
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy to allow authenticated users to read all contacts (for admin panel)
CREATE POLICY "Authenticated users can read contacts" ON contacts
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy to allow authenticated users to update read status
CREATE POLICY "Authenticated users can update contacts" ON contacts
  FOR UPDATE
  TO authenticated
  USING (true);
