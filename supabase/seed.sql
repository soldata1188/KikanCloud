-- CLEANUP EVERYTHING
DELETE FROM auth.identities;
DELETE FROM auth.users;
DELETE FROM auth.instances;

DO $$
DECLARE
  uid UUID := '99999999-9999-9999-9999-999999999999';
  tid UUID := '11111111-1111-1111-1111-111111111111';
BEGIN
  -- 1. Create Auth Instance (CRITICAL for local GoTrue)
  INSERT INTO auth.instances (id, uuid, created_at, updated_at)
  VALUES ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', now(), now());

  -- 2. Create Tenant
  INSERT INTO public.tenants (id, name, org_type, status) 
  VALUES (tid, 'KikanCloud Demo Union', 'kanri_dantai', 'active')
  ON CONFLICT (id) DO NOTHING;

  -- 3. Create Auth User (ALL token fields MUST be '' not NULL for GoTrue compatibility)
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, 
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    last_sign_in_at, is_super_admin, is_sso_user,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, phone_change_token, phone_change, reauthentication_token
  ) VALUES (
    uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
    'admin@kikancloud.local', crypt('password123', gen_salt('bf', 10)), now(), 
    '{"provider":"email","providers":["email"]}'::jsonb, 
    '{"full_name":"Admin Mirai"}'::jsonb, 
    now(), now(), now(), false, false,
    '', '', '', '', '', '', '', ''
  );

  -- 4. Create Identity
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), uid, format('{"sub":"%s","email":"%s"}', uid::text, 'admin@kikancloud.local')::jsonb, 'email', uid::text, now(), now(), now());

  -- 5. Create Public User (Use UPSERT to ensure login_id is set)
  INSERT INTO public.users (id, tenant_id, full_name, role, login_id)
  VALUES (uid, tid, 'Administrator', 'admin', 'admin')
  ON CONFLICT (id) DO UPDATE SET login_id = EXCLUDED.login_id, tenant_id = EXCLUDED.tenant_id;

END $$;

-- 6. Sample Companies
INSERT INTO public.companies (id, tenant_id, name_jp, industry) VALUES 
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'トヨタ自動車 (株)', '製造'),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'ヤマハ発動機 (株)', '製造'),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '鹿島建設 (株)', '建設'),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'ソニー (株)', '製造'),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'パナソニック (株)', '製造');

-- 7. Sample Workers
DO $$
DECLARE
    comp_record RECORD;
    i INTEGER;
BEGIN
    FOR i IN 1..30 LOOP
        SELECT id INTO comp_record FROM public.companies ORDER BY random() LIMIT 1;
        INSERT INTO public.workers (
            tenant_id, company_id, 
            full_name_romaji, full_name_kana, dob, 
            entry_date, entry_batch,
            system_type, status
        ) VALUES (
            '11111111-1111-1111-1111-111111111111', comp_record.id,
            'WORKER ' || i, 'ワーカー ' || i, '1998-05-15',
            '2024-01-01', '2024-01生',
            (ARRAY['ginou_jisshu', 'tokuteigino'])[1 + floor(random() * 2)],
            'working'
        );
    END LOOP;
END $$;
