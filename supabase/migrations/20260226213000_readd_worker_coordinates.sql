-- Re-add latitude/longitude to workers table (previously dropped in cleanup)
ALTER TABLE public.workers ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE public.workers ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
