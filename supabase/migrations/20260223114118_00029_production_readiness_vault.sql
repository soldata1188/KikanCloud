-- ==========================================
-- 1. KHO LƯU TRỮ (SUPABASE STORAGE)
-- ==========================================
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('documents', 'documents', false),
  ('zairyu_cards', 'zairyu_cards', false)
ON CONFLICT (id) DO NOTHING;

-- Bật RLS cho Storage (removed because it causes permission error on remote push, usually enabled by default)

-- Cấp quyền Upload/Đọc cho user đã đăng nhập vào đúng Bucket
DROP POLICY IF EXISTS "Authenticated users can upload zairyu" ON storage.objects;
CREATE POLICY "Authenticated users can upload zairyu" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'zairyu_cards');

DROP POLICY IF EXISTS "Authenticated users can read zairyu" ON storage.objects;
CREATE POLICY "Authenticated users can read zairyu" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'zairyu_cards');

DROP POLICY IF EXISTS "Authenticated users can manage documents" ON storage.objects;
CREATE POLICY "Authenticated users can manage documents" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'documents');

-- ==========================================
-- 2. ĐÁNH CHỈ MỤC TĂNG TỐC (B-TREE INDEXES)
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON public.users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_companies_tenant_id ON public.companies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workers_tenant_id ON public.workers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audits_tenant_id ON public.audits(tenant_id);

CREATE INDEX IF NOT EXISTS idx_workers_company_id ON public.workers(company_id);
CREATE INDEX IF NOT EXISTS idx_audits_company_id ON public.audits(company_id);

CREATE INDEX IF NOT EXISTS idx_workers_card ON public.workers(zairyu_no);

-- ==========================================
-- 3. KHÓA CHỐNG TRÙNG LẶP (UNIQUE CONSTRAINTS)
-- ==========================================
-- Cấm 1 Nghiệp đoàn nhập trùng 1 mã thẻ Zairyu nhiều lần (Bỏ qua nếu rỗng)
CREATE UNIQUE INDEX IF NOT EXISTS unique_residence_card_per_tenant 
ON public.workers(tenant_id, zairyu_no) 
WHERE zairyu_no IS NOT NULL AND zairyu_no != '';
