-- [BẮT ĐẦU SQL] --
ALTER TABLE public.schedule_entries ALTER COLUMN tenant_id SET DEFAULT public.get_auth_tenant_id();
-- [KẾT THÚC SQL] --
