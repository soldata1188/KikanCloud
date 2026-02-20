CREATE TABLE public.procedures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    worker_id UUID REFERENCES public.workers(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    agency TEXT CHECK (agency IN ('nyukan', 'kikou', 'kentei')) NOT NULL,
    procedure_name TEXT NOT NULL,
    status TEXT CHECK (status IN ('preparing', 'submitted', 'completed', 'issue')) DEFAULT 'preparing',
    target_date DATE,
    submitted_date DATE,
    completed_date DATE,
    pic_name TEXT,
    notes TEXT,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_upd_procedures BEFORE UPDATE ON public.procedures FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
ALTER TABLE public.procedures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant Isolation" ON public.procedures FOR ALL USING (tenant_id = public.get_auth_tenant_id() AND is_deleted = false);
