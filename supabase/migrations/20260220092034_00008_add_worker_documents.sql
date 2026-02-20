-- 1. Khởi tạo Private Bucket cho Tài liệu nhạy cảm
INSERT INTO storage.buckets (id, name, public) 
VALUES ('worker_docs', 'worker_docs', false) 
ON CONFLICT (id) DO NOTHING;

-- Thiết lập RLS cho Bucket (Chỉ Authenticated Users mới được thao tác)
CREATE POLICY "Allow auth uploads" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'worker_docs');
CREATE POLICY "Allow auth updates" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'worker_docs');
CREATE POLICY "Allow auth deletes" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'worker_docs');
CREATE POLICY "Allow auth read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'worker_docs');

-- 2. Tạo bảng Metadata quản lý file
CREATE TABLE public.worker_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
    doc_type TEXT CHECK (doc_type IN ('passport', 'zairyu_card', 'contract', 'photo', 'other')) DEFAULT 'other',
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    content_type TEXT,
    uploaded_by TEXT,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.worker_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant Isolation" ON public.worker_documents FOR ALL USING (tenant_id = public.get_auth_tenant_id() AND is_deleted = false);
