-- Step 1: Drop existing simple TEXT columns (Destructive, ok for new feature)
ALTER TABLE public.workers DROP COLUMN IF EXISTS kentei_status;
ALTER TABLE public.workers DROP COLUMN IF EXISTS kikou_status;
ALTER TABLE public.workers DROP COLUMN IF EXISTS nyukan_status;

-- Step 2: Recreate as JSONB columns with a default structured object
-- Schema: { "type": "---", "progress": "未着手", "assignee": "---", "note": "" }
ALTER TABLE public.workers ADD COLUMN kentei_status JSONB DEFAULT '{"type": "---", "progress": "未着手", "assignee": "---", "note": ""}'::jsonb;
ALTER TABLE public.workers ADD COLUMN kikou_status JSONB DEFAULT '{"type": "---", "progress": "未着手", "assignee": "---", "note": ""}'::jsonb;
ALTER TABLE public.workers ADD COLUMN nyukan_status JSONB DEFAULT '{"type": "---", "progress": "未着手", "assignee": "---", "note": ""}'::jsonb;
