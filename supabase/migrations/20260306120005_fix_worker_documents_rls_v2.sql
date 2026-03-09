DROP POLICY IF EXISTS "Tenant Isolation" ON public.worker_documents;
DROP POLICY IF EXISTS "Tenant Isolation_Select" ON public.worker_documents;
DROP POLICY IF EXISTS "Tenant Isolation_Insert" ON public.worker_documents;
DROP POLICY IF EXISTS "Tenant Isolation_Update" ON public.worker_documents;
DROP POLICY IF EXISTS "Tenant Isolation_Delete" ON public.worker_documents;

CREATE POLICY "Tenant_Isolation_All" ON public.worker_documents 
FOR ALL USING (tenant_id = public.get_auth_tenant_id());
