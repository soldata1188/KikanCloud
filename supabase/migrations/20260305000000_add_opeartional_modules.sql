-- 1. Create tasks table
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    worker_id UUID REFERENCES public.workers(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT CHECK (status IN ('todo', 'in_progress', 'done')) DEFAULT 'todo',
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    due_date TIMESTAMPTZ,
    assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
    task_type TEXT CHECK (task_type IN ('manual', 'auto_visa', 'auto_exam', 'auto_kansa')) DEFAULT 'manual',
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create shien_logs table
CREATE TABLE public.shien_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    worker_id UUID REFERENCES public.workers(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    support_date DATE NOT NULL DEFAULT CURRENT_DATE,
    support_type TEXT CHECK (support_type IN ('visit', 'phone', 'online', 'other')) DEFAULT 'visit',
    author_id UUID REFERENCES public.users(id),
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Modify client_documents to support general company files
ALTER TABLE public.client_documents ALTER COLUMN worker_id DROP NOT NULL;
ALTER TABLE public.client_documents ADD COLUMN doc_category TEXT CHECK (doc_category IN ('general', 'worker_specific')) DEFAULT 'worker_specific';

-- 4. Enable RLS and add Policies
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shien_logs ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER set_upd_tasks BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_upd_shien_logs BEFORE UPDATE ON public.shien_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE POLICY "Tenant Isolation" ON public.tasks FOR ALL USING (tenant_id = public.get_auth_tenant_id() AND is_deleted = false);
CREATE POLICY "Tenant Isolation" ON public.shien_logs FOR ALL USING (tenant_id = public.get_auth_tenant_id() AND is_deleted = false);
