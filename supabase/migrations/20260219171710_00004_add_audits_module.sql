CREATE TABLE public.audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    audit_type TEXT CHECK (audit_type IN ('kansa', 'homon', 'rinji')) DEFAULT 'homon',
    scheduled_date DATE NOT NULL,
    actual_date DATE,
    status TEXT CHECK (status IN ('planned', 'in_progress', 'completed')) DEFAULT 'planned',
    pic_name TEXT,
    notes TEXT,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_upd_audits BEFORE UPDATE ON public.audits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant Isolation" ON public.audits FOR ALL USING (tenant_id = public.get_auth_tenant_id() AND is_deleted = false);
