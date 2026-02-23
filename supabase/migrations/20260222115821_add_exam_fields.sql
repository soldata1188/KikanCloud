-- Add exam information fields to workers table
ALTER TABLE public.workers 
ADD COLUMN IF NOT EXISTS exam_academic DATE,
ADD COLUMN IF NOT EXISTS exam_practical DATE,
ADD COLUMN IF NOT EXISTS exam_witness DATE;
