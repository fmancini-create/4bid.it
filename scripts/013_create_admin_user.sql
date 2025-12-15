-- Create admin user in Supabase Auth
-- This script creates the admin user with email f.mancini@4bid.it
-- You will need to set the password through Supabase Dashboard or use this as a guide

-- Note: In Supabase, you typically create users through:
-- 1. The Supabase Dashboard (Authentication > Users > Add User)
-- 2. Or via the signup function in your app
-- 3. Or via Supabase Admin API

-- For now, the easiest way is to:
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to Authentication > Users
-- 3. Click "Add User"
-- 4. Enter email: f.mancini@4bid.it
-- 5. Set a password of your choice
-- 6. Confirm the email (toggle "Auto Confirm User")

-- Alternatively, you can use this SQL to create the user directly:
-- WARNING: This bypasses Supabase Auth and should only be used in development

-- First, generate a password hash for your desired password
-- Example password: "Admin2024!" 
-- You can generate a bcrypt hash at https://bcrypt-generator.com/

-- INSERT INTO auth.users (
--   instance_id,
--   id,
--   aud,
--   role,
--   email,
--   encrypted_password,
--   email_confirmed_at,
--   created_at,
--   updated_at,
--   confirmation_token,
--   email_change,
--   email_change_token_new,
--   recovery_token
-- )
-- VALUES (
--   '00000000-0000-0000-0000-000000000000',
--   gen_random_uuid(),
--   'authenticated',
--   'authenticated',
--   'f.mancini@4bid.it',
--   crypt('YOUR_PASSWORD_HERE', gen_salt('bf')), -- Replace YOUR_PASSWORD_HERE with your password
--   NOW(),
--   NOW(),
--   NOW(),
--   '',
--   '',
--   '',
--   ''
-- );

-- RECOMMENDED: Use the Supabase Dashboard to create the admin user instead
SELECT 'Please create admin user f.mancini@4bid.it through Supabase Dashboard > Authentication > Users > Add User' as message;
