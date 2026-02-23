-- 1. XÓA DỮ LIỆU MỒ CÔI (Rác sinh ra do quá trình test)
DELETE FROM public.workers WHERE company_id IS NOT NULL AND company_id NOT IN (SELECT id FROM public.companies);
DELETE FROM public.audits WHERE company_id IS NOT NULL AND company_id NOT IN (SELECT id FROM public.companies);
DELETE FROM public.users WHERE company_id IS NOT NULL AND company_id NOT IN (SELECT id FROM public.companies);

-- 2. SIẾT CHẶT KHÓA NGOẠI (ON DELETE CASCADE / SET NULL) 
-- Bảng Workers: Xóa Xí nghiệp -> Xóa Thực tập sinh
ALTER TABLE public.workers DROP CONSTRAINT IF EXISTS workers_company_id_fkey;
ALTER TABLE public.workers ADD CONSTRAINT workers_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- Bảng Audits: Xóa Xí nghiệp -> Xóa Lịch thanh tra
ALTER TABLE public.audits DROP CONSTRAINT IF EXISTS audits_company_id_fkey;
ALTER TABLE public.audits ADD CONSTRAINT audits_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- Bảng Users (Portal): Xóa Xí nghiệp -> User mất quyền truy cập (SET NULL để giữ tài khoản)
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_company_id_fkey;
ALTER TABLE public.users ADD CONSTRAINT users_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;

-- 3. ĐẢM BẢO RLS ĐƯỢC BẬT 100% TRÊN CÁC BẢNG LÕI
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;
