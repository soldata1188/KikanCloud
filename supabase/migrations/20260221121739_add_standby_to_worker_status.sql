-- Drop the existing check constraint on the status column of the workers table
ALTER TABLE public.workers DROP CONSTRAINT IF EXISTS workers_status_check;

-- Add the new check constraint including 'standby'
ALTER TABLE public.workers ADD CONSTRAINT workers_status_check CHECK (status IN ('waiting', 'working', 'missing', 'returned', 'standby'));
