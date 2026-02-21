DO $$
BEGIN
  -- 1. Chuyển đổi dữ liệu cũ
  UPDATE public.users SET role = 'company_admin' WHERE role = 'company_client';
  UPDATE public.notifications SET target_role = 'company_admin' WHERE target_role = 'company_client';

  -- 2. Cập nhật Constraint của Roles
  ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
  ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'staff', 'company_admin', 'company_user', 'worker'));
END $$;

-- 3. Cập nhật Trigger Notifications
CREATE OR REPLACE FUNCTION trigger_notify_on_message() RETURNS trigger AS $func$
BEGIN
  IF NEW.sender_role IN ('company_admin', 'company_user', 'company_client') THEN
    INSERT INTO public.notifications (tenant_id, target_role, target_company_id, title, content, link_url)
    VALUES (NEW.tenant_id, 'admin', NULL, '💬 企業からの新着メッセージ', NEW.sender_name || 'からのメッセージ', '/companies/' || NEW.company_id || '/edit');
  ELSE
    INSERT INTO public.notifications (tenant_id, target_role, target_company_id, title, content, link_url)
    VALUES (NEW.tenant_id, 'company_admin', NEW.company_id, '💬 監理団体からのメッセージ', NEW.sender_name || 'からのメッセージ', '/portal/chat');
  END IF;
  RETURN NEW;
END;
$func$ LANGUAGE plpgsql;
