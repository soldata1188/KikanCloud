-- [BẮT ĐẦU SQL] --

-- Tạo hàm trigger tự động tạo Tenant và public.users cho bất kỳ user mới nào chưa có
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  new_tenant_id UUID;
BEGIN
  -- Nếu user đã có trong public.users thì bỏ qua
  IF EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
    RETURN NEW;
  END IF;

  -- B1. Tạo 1 tenant mặc định cho user này
  new_tenant_id := gen_random_uuid();
  INSERT INTO public.tenants (id, name, org_type, status)
  VALUES (new_tenant_id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'Chưa đặt tên') || ' (Workspace)', 'kanri_dantai', 'active');

  -- B2. Thêm vào public.users
  INSERT INTO public.users (id, tenant_id, full_name, role)
  VALUES (NEW.id, new_tenant_id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'Unknown User'), 'admin');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Gắn Trigger vào bảng auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Chạy thử cho các user CŨ đang bị mồ côi (orphaned)
DO $$
DECLARE
  orphan_user RECORD;
  new_t_id UUID;
BEGIN
  FOR orphan_user IN 
    SELECT * FROM auth.users WHERE id NOT IN (SELECT id FROM public.users)
  LOOP
    new_t_id := gen_random_uuid();
    INSERT INTO public.tenants (id, name, org_type, status)
    VALUES (new_t_id, COALESCE(orphan_user.raw_user_meta_data->>'full_name', orphan_user.email, 'Workspace'), 'kanri_dantai', 'active');

    INSERT INTO public.users (id, tenant_id, full_name, role)
    VALUES (orphan_user.id, new_t_id, COALESCE(orphan_user.raw_user_meta_data->>'full_name', orphan_user.email, 'User'), 'admin');
  END LOOP;
END;
$$;
-- [KẾT THÚC SQL] --
