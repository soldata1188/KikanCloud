-- Sửa trigger để không block user creation khi có lỗi
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_tenant_id UUID;
BEGIN
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
  -- Không block user creation dù trigger lỗi
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
