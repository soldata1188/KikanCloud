DROP POLICY IF EXISTS "Tenant Isolation" ON public.worker_documents;

CREATE POLICY "Tenant Isolation_Select" ON public.worker_documents 
FOR SELECT USING (tenant_id = public.get_auth_tenant_id() AND is_deleted = false);

CREATE POLICY "Tenant Isolation_Insert" ON public.worker_documents 
FOR INSERT WITH CHECK (tenant_id = public.get_auth_tenant_id());

CREATE POLICY "Tenant Isolation_Update" ON public.worker_documents 
FOR UPDATE USING (tenant_id = public.get_auth_tenant_id());

CREATE POLICY "Tenant Isolation_Delete" ON public.worker_documents 
FOR DELETE USING (tenant_id = public.get_auth_tenant_id());
