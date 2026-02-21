-- [BẮT ĐẦU SQL] --
CREATE TABLE public.schedule_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    row_index INTEGER NOT NULL CHECK (row_index >= 1 AND row_index <= 4), -- 4 rows since row 0 is disabled
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, entry_date, row_index)
);

CREATE TRIGGER set_upd_schedule_entries 
BEFORE UPDATE ON public.schedule_entries 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.schedule_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant Isolation" 
ON public.schedule_entries 
FOR ALL USING (tenant_id = public.get_auth_tenant_id());
-- [KẾT THÚC SQL] --
