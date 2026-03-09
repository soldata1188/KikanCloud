-- CLEANUP MIGRATION: Finalizing production schema
-- Author: Senior Software Engineer (Antigravity)

-- 1. Remove "Lonely" Tables (Tables that are not used in current codebase)
DROP TABLE IF EXISTS public.procedures CASCADE;

-- 2. Ensure RLS is enabled on all critical remaining tables
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.visas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.job_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.shien_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.company_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.worker_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.workflow_maps ENABLE ROW LEVEL SECURITY;

-- 3. Final data integrity checks (Optional, can be added later)
-- Example: ensure all workers belong to a tenant
-- UPDATE public.workers SET tenant_id = (SELECT id FROM public.tenants LIMIT 1) WHERE tenant_id IS NULL;
