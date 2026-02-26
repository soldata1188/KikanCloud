-- Add AI settings columns to users table
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS ai_model VARCHAR(100) DEFAULT 'gemini-2.5-flash',
    ADD COLUMN IF NOT EXISTS ai_tone  VARCHAR(50)  DEFAULT 'professional';
