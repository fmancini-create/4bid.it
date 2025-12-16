-- Fix RLS policies for project_submissions table to allow public inserts

-- Drop existing restrictive policies if any
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON project_submissions;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON project_submissions;

-- Create policy to allow public inserts (anyone can submit a project idea)
CREATE POLICY "Allow public inserts"
ON project_submissions
FOR INSERT
TO public
WITH CHECK (true);

-- Create policy to allow authenticated users (admin) to read all submissions
CREATE POLICY "Allow authenticated users to read all"
ON project_submissions
FOR SELECT
TO authenticated
USING (true);

-- Create policy to allow authenticated users (admin) to update submissions
CREATE POLICY "Allow authenticated users to update all"
ON project_submissions
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Create policy to allow authenticated users (admin) to delete submissions
CREATE POLICY "Allow authenticated users to delete all"
ON project_submissions
FOR DELETE
TO authenticated
USING (true);

-- Ensure RLS is enabled
ALTER TABLE project_submissions ENABLE ROW LEVEL SECURITY;
