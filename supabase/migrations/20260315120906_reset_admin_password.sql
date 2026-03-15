-- Clean up broken auth users for data@solutioncoop-jp.com and recreate properly
DO $$
DECLARE
  v_email TEXT := 'data@solutioncoop-jp.com';
  v_user_id UUID;
  v_tenant_id UUID := '005e394f-ec5e-48c3-a221-8a1bcedd65d7';
BEGIN
  -- 1. Xoá tất cả identities liên quan
  DELETE FROM auth.identities
  WHERE user_id IN (SELECT id FROM auth.users WHERE email = v_email);

  -- 2. Xoá tất cả sessions
  DELETE FROM auth.sessions
  WHERE user_id IN (SELECT id FROM auth.users WHERE email = v_email);

  -- 3. Xoá refresh tokens
  DELETE FROM auth.refresh_tokens
  WHERE user_id IN (
    SELECT id::text FROM auth.users WHERE email = v_email
  );

  -- 4. Xoá public.users records cho các user này
  DELETE FROM public.users
  WHERE id IN (SELECT id FROM auth.users WHERE email = v_email);

  -- 5. Xoá auth.users
  DELETE FROM auth.users WHERE email = v_email;

  -- 6. Tạo lại với bcrypt hash đúng qua pgcrypto
  v_user_id := gen_random_uuid();

  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    is_super_admin, role, aud
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    v_email,
    '$2b$10$1wceEVWPmfTwEkd71wm8suCDXaOED/jGgQFhpF1X7IWFsNtrLzqaW',
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Admin"}',
    FALSE, 'authenticated', 'authenticated'
  );

  -- 7. Identity
  INSERT INTO auth.identities (
    id, user_id, provider_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    v_user_id,
    v_email,
    jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true),
    'email',
    NOW(), NOW(), NOW()
  );

  -- 8. public.users
  INSERT INTO public.users (id, tenant_id, role, full_name, updated_at)
  VALUES (v_user_id, v_tenant_id, 'admin', 'Admin', NOW())
  ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    tenant_id = v_tenant_id,
    updated_at = NOW();

  RAISE NOTICE 'Admin user recreated: % (id: %)', v_email, v_user_id;
END;
$$;
