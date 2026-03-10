-- Migration: add_unique_constraint_to_workers
-- Description: Adds a unique constraint to prevent duplicate workers for the same tenant with the same name and DOB, supporting UPSERT.

ALTER TABLE public.workers 
DROP CONSTRAINT IF EXISTS workers_tenant_name_dob_key;

ALTER TABLE public.workers 
ADD CONSTRAINT workers_tenant_name_dob_key UNIQUE (tenant_id, full_name_romaji, dob);
