-- Full cleanup: delete all demo/junk data
-- Keep only: tenant 005e394f (ソリューション協同組合) + admin user 164e964a

-- 1. Data tables (dependents first)
DELETE FROM public.worker_documents;
DELETE FROM public.exams;
DELETE FROM public.visas;
DELETE FROM public.job_transfers;
DELETE FROM public.tasks;
DELETE FROM public.audits;
DELETE FROM public.workers;
DELETE FROM public.companies;
DELETE FROM public.messages;

-- 2. Remove all tenants except the real one
DELETE FROM public.tenants
WHERE id != '005e394f-ec5e-48c3-a221-8a1bcedd65d7';

-- 3. Ensure correct tenant name
UPDATE public.tenants
SET name = 'ソリューション協同組合', updated_at = NOW()
WHERE id = '005e394f-ec5e-48c3-a221-8a1bcedd65d7';

-- 4. Remove all public.users except admin
DELETE FROM public.users
WHERE id != '164e964a-d314-4d16-9c2d-dee587d5f8d9';
