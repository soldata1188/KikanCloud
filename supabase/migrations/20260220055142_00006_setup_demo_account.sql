CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Thêm cột role vào bảng users (và nới lỏng Check Constraint)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin';
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('super_admin', 'union_admin', 'union_staff', 'company_client', 'admin', 'staff'));

-- 2. Khởi tạo tài khoản Demo cứng (Bypass UI Registration)
DO $$
DECLARE
  demo_tenant_id UUID := '22222222-2222-2222-2222-222222222222';
  demo_user_id UUID := '11111111-1111-1111-1111-111111111111';
BEGIN
  -- Tạo Tenant dành riêng cho Demo
  INSERT INTO public.tenants (id, name) VALUES (demo_tenant_id, 'KikanCloud 協同組合 (DEMO)') 
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

  -- Xóa user cũ nếu bị kẹt email để tạo lại cho chuẩn ID
  DELETE FROM auth.users WHERE email = 'demo@kikancloud.com' AND id != demo_user_id;

  -- Tạo user trong auth.users của Supabase (Mật khẩu: demo123)
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change, phone_change_token, phone_change, email_change_token_current, reauthentication_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', demo_user_id, 'authenticated', 'authenticated', 'demo@kikancloud.com', crypt('demo123', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{"full_name": "デモ管理者 (Admin)"}', now(), now(),
    '', '', '', '', '', '', '', ''
  ) ON CONFLICT (id) DO UPDATE SET encrypted_password = crypt('demo123', gen_salt('bf'));
  -- Bơm Identity cho Auth
  DELETE FROM auth.identities WHERE user_id = demo_user_id;
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), demo_user_id, format('{"sub":"%s","email":"%s"}', demo_user_id::text, 'demo@kikancloud.com')::jsonb, 'email', demo_user_id::text, now(), now(), now());

  -- Cập nhật thông tin profile trong public.users
  INSERT INTO public.users (id, tenant_id, full_name, role)
  VALUES (demo_user_id, demo_tenant_id, 'デモ管理者 (Admin)', 'admin')
  ON CONFLICT (id) DO UPDATE SET tenant_id = demo_tenant_id, full_name = 'デモ管理者 (Admin)', role = 'admin';
END $$;
