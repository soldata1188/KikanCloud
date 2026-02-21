-- [BẮT ĐẦU SQL] --
-- Xóa Policy cũ gộp chung bị lỏng lẻo
DROP POLICY IF EXISTS "Tenant Isolation" ON public.schedule_entries;

-- Tạo các Policy tách biệt rõ ràng cho từng hành động
CREATE POLICY "Tenant Isolation Select" 
ON public.schedule_entries 
FOR SELECT USING (tenant_id = public.get_auth_tenant_id());

CREATE POLICY "Tenant Isolation Insert" 
ON public.schedule_entries 
FOR INSERT WITH CHECK (tenant_id = public.get_auth_tenant_id());

CREATE POLICY "Tenant Isolation Update" 
ON public.schedule_entries 
FOR UPDATE USING (tenant_id = public.get_auth_tenant_id());

CREATE POLICY "Tenant Isolation Delete" 
ON public.schedule_entries 
FOR DELETE USING (tenant_id = public.get_auth_tenant_id());
-- [KẾT THÚC SQL] --
