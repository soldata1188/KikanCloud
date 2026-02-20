DO $$
DECLARE
  demo_tenant_id UUID := '22222222-2222-2222-2222-222222222222';
  staff_user_id UUID := '33333333-3333-3333-3333-333333333333';
BEGIN
  DELETE FROM auth.users WHERE email = 'staff@kikancloud.com' AND id != staff_user_id;

  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change, phone_change_token, phone_change, email_change_token_current, reauthentication_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', staff_user_id, 'authenticated', 'authenticated', 'staff@kikancloud.com', crypt('staff123', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{"full_name": "一般スタッフ (Staff)"}', now(), now(),
    '', '', '', '', '', '', '', ''
  ) ON CONFLICT (id) DO UPDATE SET encrypted_password = crypt('staff123', gen_salt('bf'));

  INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), staff_user_id, format('{"sub":"%s","email":"%s"}', staff_user_id::text, 'staff@kikancloud.com')::jsonb, 'email', now(), now(), now())
  ON CONFLICT DO NOTHING;

  INSERT INTO public.users (id, tenant_id, full_name, role)
  VALUES (staff_user_id, demo_tenant_id, '一般スタッフ (Staff)', 'staff')
  ON CONFLICT (id) DO UPDATE SET tenant_id = demo_tenant_id, full_name = '一般スタッフ (Staff)', role = 'staff';
END $$;
