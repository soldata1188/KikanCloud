-- [BẮT ĐẦU SQL] --
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ language 'plpgsql';

CREATE TABLE public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL,
    org_type TEXT CHECK (org_type IN ('kanri_dantai', 'toroku_shien')) DEFAULT 'kanri_dantai',
    license_number TEXT, external_auditor_name TEXT, domain TEXT UNIQUE,
    status TEXT CHECK (status IN ('active', 'suspended')) DEFAULT 'active',
    is_deleted BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    company_id UUID, full_name TEXT NOT NULL,
    role TEXT CHECK (role IN ('super_admin', 'union_admin', 'union_staff', 'company_client')) DEFAULT 'union_staff',
    is_deleted BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.get_auth_tenant_id() RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT tenant_id FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;

CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name_jp TEXT NOT NULL, corporate_number TEXT, address TEXT, representative TEXT, pic_name TEXT, guidance_manager TEXT,
    is_deleted BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.workers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    full_name_romaji TEXT NOT NULL, full_name_kana TEXT NOT NULL, dob DATE NOT NULL,
    passport_no TEXT, passport_exp DATE, zairyu_no TEXT, entry_date DATE,
    system_type TEXT CHECK (system_type IN ('ginou_jisshu', 'ikusei_shuro', 'tokuteigino')) DEFAULT 'ikusei_shuro',
    industry_field TEXT, japanese_level TEXT,
    status TEXT CHECK (status IN ('waiting', 'working', 'missing', 'returned')) DEFAULT 'working',
    is_deleted BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.visas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
    visa_type TEXT NOT NULL, expiration_date DATE NOT NULL,
    process_status TEXT CHECK (process_status IN ('gathering', 'submitted', 'additional_req', 'approved')) DEFAULT 'gathering',
    is_deleted BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
    exam_type TEXT CHECK (exam_type IN ('japanese', 'skill')), target_level TEXT NOT NULL,
    deadline_date DATE NOT NULL, result TEXT CHECK (result IN ('planned', 'passed', 'failed')) DEFAULT 'planned',
    is_deleted BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.job_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
    from_company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    to_company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    reason TEXT CHECK (reason IN ('voluntary', 'company_issue')),
    status TEXT CHECK (status IN ('intent_declared', 'hello_work_matching', 'paperwork_submitted', 'transferred')) DEFAULT 'intent_declared',
    transfer_date DATE, is_deleted BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_upd_tenants BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_upd_users BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_upd_companies BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_upd_workers BEFORE UPDATE ON public.workers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_upd_visas BEFORE UPDATE ON public.visas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_upd_exams BEFORE UPDATE ON public.exams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_upd_transfers BEFORE UPDATE ON public.job_transfers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY; ALTER TABLE public.users ENABLE ROW LEVEL SECURITY; ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY; ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY; ALTER TABLE public.visas ENABLE ROW LEVEL SECURITY; ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY; ALTER TABLE public.job_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant Isolation" ON public.companies FOR ALL USING (tenant_id = public.get_auth_tenant_id() AND is_deleted = false);
CREATE POLICY "Tenant Isolation" ON public.workers FOR ALL USING (tenant_id = public.get_auth_tenant_id() AND is_deleted = false);
CREATE POLICY "Tenant Isolation" ON public.visas FOR ALL USING (tenant_id = public.get_auth_tenant_id() AND is_deleted = false);
CREATE POLICY "Tenant Isolation" ON public.exams FOR ALL USING (tenant_id = public.get_auth_tenant_id() AND is_deleted = false);
CREATE POLICY "Tenant Isolation" ON public.job_transfers FOR ALL USING (tenant_id = public.get_auth_tenant_id() AND is_deleted = false);
CREATE POLICY "Tenant Isolation" ON public.users FOR ALL USING (tenant_id = public.get_auth_tenant_id() AND is_deleted = false);
CREATE POLICY "Tenant self view" ON public.tenants FOR SELECT USING (id = public.get_auth_tenant_id() AND is_deleted = false);
-- [KẾT THÚC SQL] --
