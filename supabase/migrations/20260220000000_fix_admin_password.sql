-- Ensure pgcrypto is available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Reset password for admin user securely
UPDATE auth.users
SET encrypted_password = crypt('password123', gen_salt('bf'))
WHERE email = 'admin@mirai.com';
