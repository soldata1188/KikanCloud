-- Cleanup and sync schema
DROP TABLE IF EXISTS test_workers CASCADE;
DROP TABLE IF EXISTS old_operations CASCADE;

-- Drop obsolete fields not in the 23 required fields.
ALTER TABLE public.workers
DROP COLUMN IF EXISTS latitude,
DROP COLUMN IF EXISTS longitude,
DROP COLUMN IF EXISTS exam_academic,
DROP COLUMN IF EXISTS exam_practical,
DROP COLUMN IF EXISTS exam_witness;

-- Purge Mock Data
TRUNCATE TABLE public.workers CASCADE;
