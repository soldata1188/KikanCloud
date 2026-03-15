-- Bypass GoTrue's auth.admin.createUser (which fails with "Database error checking email")
-- by inserting directly into auth.users + auth.identities via a SECURITY DEFINER function.

-- Step 1: Update handle_new_user trigger to skip auto-provisioning when called from our RPC
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_tenant_id UUID;
BEGIN
  -- Skip for admin-provisioned accounts (handled by provision_account RPC)
  IF current_setting('app.provisioning', true) = 'true' THEN
    RETURN NEW;
  END IF;

  IF EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
    RETURN NEW;
  END IF;

  new_tenant_id := gen_random_uuid();

  INSERT INTO public.tenants (id, name, org_type, status)
  VALUES (
    new_tenant_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'Workspace') || ' (Workspace)',
    'kanri_dantai',
    'active'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.users (id, tenant_id, full_name, role)
  VALUES (
    NEW.id,
    new_tenant_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'User'),
    'admin'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Step 2: Create the provision_account RPC
CREATE OR REPLACE FUNCTION public.provision_account(
  p_login_id    TEXT,
  p_password    TEXT,
  p_full_name   TEXT,
  p_role        TEXT,
  p_tenant_id   UUID,
  p_company_id  UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id   UUID;
  v_email     TEXT;
  v_existing  UUID;
BEGIN
  -- Sanitize login_id
  p_login_id := lower(trim(p_login_id));

  -- Validate format: only lowercase alphanumeric + hyphen
  IF p_login_id !~ '^[a-z0-9_-]+$' THEN
    RETURN json_build_object('error', 'ログインIDは半角英数字とハイフン(-)のみ使用可能です。');
  END IF;

  IF length(p_password) < 6 THEN
    RETURN json_build_object('error', 'パスワードは6文字以上で入力してください。');
  END IF;

  v_email := p_login_id || '@kikancloud.local';

  -- Check login_id uniqueness in public.users
  SELECT id INTO v_existing FROM public.users WHERE login_id = p_login_id LIMIT 1;
  IF v_existing IS NOT NULL THEN
    RETURN json_build_object('error', 'このログインIDは既に使用されています。');
  END IF;

  -- Check email uniqueness in auth.users
  SELECT id INTO v_existing FROM auth.users WHERE email = v_email AND deleted_at IS NULL LIMIT 1;
  IF v_existing IS NOT NULL THEN
    RETURN json_build_object('error', 'このログインIDは既に使用されています。');
  END IF;

  v_user_id := gen_random_uuid();

  -- Suppress handle_new_user trigger for this transaction
  PERFORM set_config('app.provisioning', 'true', true);

  -- Insert into auth.users (bypasses GoTrue email check)
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data,
    aud,
    role
  ) VALUES (
    v_user_id,
    v_email,
    crypt(p_password, gen_salt('bf', 10)),
    now(),
    now(),
    now(),
    jsonb_build_object('full_name', p_full_name),
    'authenticated',
    'authenticated'
  );

  -- Insert into auth.identities (required for email login)
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    v_user_id,
    jsonb_build_object(
      'sub',            v_user_id::text,
      'email',          v_email,
      'email_verified', true,
      'provider',       'email'
    ),
    'email',
    v_email,
    now(),
    now(),
    now()
  );

  -- Insert into public.users with correct tenant + role
  INSERT INTO public.users (id, tenant_id, full_name, role, login_id, company_id)
  VALUES (v_user_id, p_tenant_id, p_full_name, p_role, p_login_id, p_company_id)
  ON CONFLICT (id) DO UPDATE SET
    tenant_id  = EXCLUDED.tenant_id,
    full_name  = EXCLUDED.full_name,
    role       = EXCLUDED.role,
    login_id   = EXCLUDED.login_id,
    company_id = EXCLUDED.company_id;

  RETURN json_build_object(
    'success',  true,
    'user_id',  v_user_id,
    'login_id', p_login_id
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('error', SQLERRM);
END;
$$;

-- Grant execute to service_role only
GRANT EXECUTE ON FUNCTION public.provision_account(TEXT, TEXT, TEXT, TEXT, UUID, UUID) TO service_role;
REVOKE EXECUTE ON FUNCTION public.provision_account(TEXT, TEXT, TEXT, TEXT, UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.provision_account(TEXT, TEXT, TEXT, TEXT, UUID, UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.provision_account(TEXT, TEXT, TEXT, TEXT, UUID, UUID) FROM authenticated;
