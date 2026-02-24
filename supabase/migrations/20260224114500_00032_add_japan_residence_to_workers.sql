-- Migration: 00032_add_japan_residence_to_workers.sql
-- Description: Adds the japan_residence field to the workers table to track their specific residence in Japan.

ALTER TABLE public.workers
ADD COLUMN IF NOT EXISTS japan_residence TEXT;

-- Down Migration Strategy
-- ALTER TABLE public.workers DROP COLUMN IF EXISTS japan_residence;
