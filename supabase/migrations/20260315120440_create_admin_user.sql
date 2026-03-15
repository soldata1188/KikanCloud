-- Create admin user: data@solutioncoop-jp.com
DO $$
DECLARE
  v_user_id UUID;
  v_tenant_id UUID := '005e394f-ec5e-48c3-a221-8a1bcedd65d7'; -- Solution Coop JP
  v_email TEXT := 'data@solutioncoop-jp.com';
  -- bcrypt hash of 'pavaca2503' (cost 10)
  v_encrypted_pw TEXT := '$2a$10$PQNuIJmxMseSB6lCJEPTZ.U4LsATTYvSYLPBSaE6z/M8cZFBcgUuO';
BEGIN
  -- 1. Controlla se esiste già
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email LIMIT 1;

  IF v_user_id IS NULL THEN
    -- 2. Inserisci direttamente in auth.users
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
      v_encrypted_pw,
      NOW(), NOW(), NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Admin"}',
      FALSE, 'authenticated', 'authenticated'
    );

    -- 3. Insert identity
    INSERT INTO auth.identities (
      id, user_id, provider_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      v_user_id,
      v_email,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email),
      'email',
      NOW(), NOW(), NOW()
    ) ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Created auth user: %', v_user_id;
  ELSE
    -- Update password
    UPDATE auth.users
    SET encrypted_password = v_encrypted_pw,
        email_confirmed_at = NOW(),
        updated_at = NOW()
    WHERE id = v_user_id;
    RAISE NOTICE 'Updated existing auth user: %', v_user_id;
  END IF;

  -- 4. Upsert public.users (no email column in this table)
  INSERT INTO public.users (id, tenant_id, role, full_name, updated_at)
  VALUES (v_user_id, v_tenant_id, 'admin', 'Admin', NOW())
  ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    tenant_id = v_tenant_id,
    updated_at = NOW();

  RAISE NOTICE 'public.users upserted for user: %', v_user_id;
END;
$$;
