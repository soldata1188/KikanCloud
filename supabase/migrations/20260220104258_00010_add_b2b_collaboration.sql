-- 1. Khởi tạo Private Bucket cho Tài liệu Xí nghiệp nộp
INSERT INTO storage.buckets (id, name, public) VALUES ('client_docs', 'client_docs', false) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Allow auth operations client" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'client_docs');

-- 2. Bảng client_documents (Quản lý Bảng lương, Chấm công do Xí nghiệp nộp)
CREATE TABLE public.client_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
    doc_type TEXT CHECK (doc_type IN ('payroll', 'timesheet', 'worklog', 'other')) NOT NULL,
    target_month TEXT NOT NULL, -- Định dạng YYYY-MM
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    uploaded_by TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant Isolation" ON public.client_documents FOR ALL USING (tenant_id = public.get_auth_tenant_id());

-- 3. Bảng messages (Chat nội bộ giữa Nghiệp đoàn và Xí nghiệp)
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id),
    sender_name TEXT NOT NULL,
    sender_role TEXT NOT NULL, -- 'admin', 'staff', 'company_client'
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant Isolation" ON public.messages FOR ALL USING (tenant_id = public.get_auth_tenant_id());
