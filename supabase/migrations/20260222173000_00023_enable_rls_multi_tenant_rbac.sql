-- [BẮT ĐẦU SQL] --
-- Nâng cấp RLS cho mô hình Multi-tenant & Role-based Access Control (RBAC)

-- 1. Bảng workers
DROP POLICY IF EXISTS "Tenant Isolation" ON public.workers;
CREATE POLICY "Tenant Admin Full Access" ON public.workers
  FOR ALL TO authenticated
  USING (
    tenant_id = public.get_auth_tenant_id()
    AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('super_admin', 'union_admin', 'union_staff', 'admin', 'staff')
  );

CREATE POLICY "Company Client View Only Own Workers" ON public.workers
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.get_auth_tenant_id()
    AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('company_client', 'company_admin', 'company_user')
  );

-- 2. Bảng companies
DROP POLICY IF EXISTS "Tenant Isolation" ON public.companies;
CREATE POLICY "Tenant Admin Full Access" ON public.companies
  FOR ALL TO authenticated
  USING (
    tenant_id = public.get_auth_tenant_id()
    AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('super_admin', 'union_admin', 'union_staff', 'admin', 'staff')
  );

CREATE POLICY "Company Client View Only Own Company" ON public.companies
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.get_auth_tenant_id()
    AND id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('company_client', 'company_admin', 'company_user')
  );

-- 3. Bảng messages
DROP POLICY IF EXISTS "Tenant Isolation" ON public.messages;
CREATE POLICY "Tenant Admin Full Access" ON public.messages
  FOR ALL TO authenticated
  USING (
    tenant_id = public.get_auth_tenant_id()
    AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('super_admin', 'union_admin', 'union_staff', 'admin', 'staff')
  );

CREATE POLICY "Company Client Chat Access" ON public.messages
  FOR ALL TO authenticated
  USING (
    tenant_id = public.get_auth_tenant_id()
    AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('company_client', 'company_admin', 'company_user')
  );

-- 4. Bảng client_documents
DROP POLICY IF EXISTS "Tenant Isolation" ON public.client_documents;
CREATE POLICY "Tenant Admin Full Access" ON public.client_documents
  FOR ALL TO authenticated
  USING (
    tenant_id = public.get_auth_tenant_id()
    AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('super_admin', 'union_admin', 'union_staff', 'admin', 'staff')
  );

CREATE POLICY "Company Client Document Access" ON public.client_documents
  FOR ALL TO authenticated
  USING (
    tenant_id = public.get_auth_tenant_id()
    AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('company_client', 'company_admin', 'company_user')
  );

-- [KẾT THÚC SQL] --
