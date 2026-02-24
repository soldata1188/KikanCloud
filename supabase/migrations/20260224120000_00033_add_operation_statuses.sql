-- Migration: 00033_add_operation_statuses.sql
-- Description: Adds tracking status columns for Kentei, Kikou, and Nyukan operations.

ALTER TABLE public.workers
ADD COLUMN IF NOT EXISTS kentei_status TEXT DEFAULT '---',
ADD COLUMN IF NOT EXISTS kikou_status TEXT DEFAULT '---',
ADD COLUMN IF NOT EXISTS nyukan_status TEXT DEFAULT '---';

-- Down Migration Strategy
-- ALTER TABLE public.workers DROP COLUMN IF EXISTS kentei_status, DROP COLUMN IF EXISTS kikou_status, DROP COLUMN IF EXISTS nyukan_status;
