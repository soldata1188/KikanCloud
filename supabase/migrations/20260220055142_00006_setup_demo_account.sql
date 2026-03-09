CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Thêm cột role vào bảng users (và nới lỏng Check Constraint)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin';
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('super_admin', 'union_admin', 'union_staff', 'company_client', 'admin', 'staff', 'company_admin', 'company_user', 'worker'));
