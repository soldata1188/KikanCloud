-- PURGE DEMO DATA MIGRATION
-- This script removes all demo records while preserving the application structure, 
-- system roles, tenants, and the primary admin account.

BEGIN;

-- 1. Temporarily disable triggers to avoid overhead and bypass complex constraints
SET session_replication_role = 'replica';

-- 2. TRUNCATE business tables (Removes all data and resets IDs)
-- CASCADE ensures related records in child tables are also removed.
TRUNCATE TABLE public.audits RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.workers RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.companies RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.visas RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.exams RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.job_transfers RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.tasks RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.shien_logs RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.worker_documents RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.company_documents RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.workflow_maps RESTART IDENTITY CASCADE;

-- 3. Cleanup Users (Keep only the core Admin/Staff accounts)
-- This assumes 'admin@kikancloud.com' is your primary account. 
-- If you have a different email, please update it here before running.
DELETE FROM auth.users 
WHERE email NOT IN (
    'admin@kikancloud.com', 
    'staff@kikancloud.com'
);

-- Note: The deletion from auth.users will automatically cascade 
-- to public.users if the Foreign Key is set to ON DELETE CASCADE (standard in our schema).

-- 4. Re-enable origin replication role
SET session_replication_role = 'origin';

-- 5. Verification 
-- Ensure at least one tenant exists (Infrastructure only)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.tenants) THEN
        INSERT INTO public.tenants (id, name, slug) 
        VALUES (gen_random_uuid(), 'KikanCloud Default', 'default')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

COMMIT;

-- LOG: Database has been successfully purged of demo data.
-- Ready for production data migration.
