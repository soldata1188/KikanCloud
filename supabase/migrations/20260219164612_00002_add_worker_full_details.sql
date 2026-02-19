-- 1. Bổ sung 8 trường dữ liệu quản lý chuyên sâu cho Người lao động
ALTER TABLE public.workers 
ADD COLUMN avatar_url TEXT,
ADD COLUMN entry_batch TEXT, -- 入国期生
ADD COLUMN cert_start_date DATE,
ADD COLUMN cert_end_date DATE,
ADD COLUMN insurance_exp DATE,
ADD COLUMN address TEXT,
ADD COLUMN nationality TEXT DEFAULT 'VNM',
ADD COLUMN sending_org TEXT;

-- 2. Khởi tạo Storage Bucket cho Avatar
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

-- 3. Cấu hình bảo mật Storage
CREATE POLICY "Avatar Public View" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Avatar Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Avatar Update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars');
