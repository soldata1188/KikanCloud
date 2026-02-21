-- [BẮT ĐẦU SQL] --
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE DEFAULT public.get_auth_tenant_id(),
    target_role TEXT NOT NULL,
    target_company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    link_url TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant Isolation" ON public.notifications FOR ALL USING (tenant_id = public.get_auth_tenant_id());

-- TRIGGER 1: Tự động báo cho Admin khi Xí nghiệp nộp tài liệu
CREATE OR REPLACE FUNCTION trigger_notify_on_client_doc() RETURNS trigger AS $$
BEGIN
  INSERT INTO public.notifications (tenant_id, target_role, target_company_id, title, content, link_url)
  VALUES (NEW.tenant_id, 'admin', NULL, '📄 企業からの書類提出', NEW.uploaded_by || 'から書類が提出されました: ' || NEW.file_name, '/workers/' || NEW.worker_id || '/documents');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_new_client_doc AFTER INSERT ON public.client_documents FOR EACH ROW EXECUTE FUNCTION trigger_notify_on_client_doc();

-- TRIGGER 2: Tự động báo Chat 2 chiều
CREATE OR REPLACE FUNCTION trigger_notify_on_message() RETURNS trigger AS $$
BEGIN
  IF NEW.sender_role = 'company_client' THEN
    INSERT INTO public.notifications (tenant_id, target_role, target_company_id, title, content, link_url)
    VALUES (NEW.tenant_id, 'admin', NULL, '💬 企業からの新着メッセージ', NEW.sender_name || 'からのメッセージ', '/companies/' || NEW.company_id || '/edit');
  ELSE
    INSERT INTO public.notifications (tenant_id, target_role, target_company_id, title, content, link_url)
    VALUES (NEW.tenant_id, 'company_client', NEW.company_id, '💬 監理団体からのメッセージ', NEW.sender_name || 'からのメッセージ', '/portal/chat');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_new_message AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION trigger_notify_on_message();
-- [KẾT THÚC SQL] --
