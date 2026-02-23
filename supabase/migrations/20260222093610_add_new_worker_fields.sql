-- Add missing fields for New Worker AI Workspace
ALTER TABLE public.workers 
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other')),
ADD COLUMN IF NOT EXISTS blood_type TEXT,
ADD COLUMN IF NOT EXISTS cert_no TEXT;
