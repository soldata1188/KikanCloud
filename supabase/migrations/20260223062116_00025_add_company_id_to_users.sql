-- Thêm cột company_id vào bảng users để liên kết tài khoản Xí nghiệp
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;

-- Cập nhật RLS Policy cho portal: Xí nghiệp chỉ xem được dữ liệu của mình
CREATE POLICY "Company users can view their own workers" ON public.workers FOR SELECT
USING (company_id = (SELECT company_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Company users can view their own audits" ON public.audits FOR SELECT
USING (company_id = (SELECT company_id FROM public.users WHERE id = auth.uid()));
