-- Remove 支援機関番号 (acceptance_notification_number) from companies table
ALTER TABLE public.companies DROP COLUMN IF EXISTS acceptance_notification_number;
