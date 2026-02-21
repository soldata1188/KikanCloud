-- 1. Đảm bảo có cột Ngày nhập cảnh ở bảng workers để làm mốc T0
ALTER TABLE public.workers ADD COLUMN IF NOT EXISTS entry_date DATE;

-- 2. Thêm worker_id vào procedures để liên kết 1-1 với Thực tập sinh
ALTER TABLE public.procedures ADD COLUMN IF NOT EXISTS worker_id UUID REFERENCES public.workers(id) ON DELETE CASCADE;

-- 3. Cho phép company_id được NULL (dành cho NLĐ chưa phân bổ xí nghiệp)
ALTER TABLE public.procedures ALTER COLUMN company_id DROP NOT NULL;

-- 4. Cập nhật Constraint ENUM của agency để chứa 'other'
ALTER TABLE public.procedures DROP CONSTRAINT IF EXISTS procedures_agency_check;
ALTER TABLE public.procedures ADD CONSTRAINT procedures_agency_check CHECK (agency IN ('nyukan', 'kikou', 'kentei', 'other'));
