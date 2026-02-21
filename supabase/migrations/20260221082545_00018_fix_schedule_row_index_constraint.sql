-- [BẮT ĐẦU SQL] --
-- Drop the existing constraint
ALTER TABLE public.schedule_entries DROP CONSTRAINT IF EXISTS schedule_entries_row_index_check;

-- Add the new constraint allowing up to 5 rows
ALTER TABLE public.schedule_entries ADD CONSTRAINT schedule_entries_row_index_check CHECK (row_index >= 1 AND row_index <= 5);
-- [KẾT THÚC SQL] --
