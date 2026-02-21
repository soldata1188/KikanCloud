-- [BẮT ĐẦU SQL] --

-- RPC để lấy sự kiện lịch của user hiện tại
CREATE OR REPLACE FUNCTION public.get_schedule_entries_by_user(p_start_date DATE, p_end_date DATE)
RETURNS TABLE(entry_date DATE, row_index INTEGER, content TEXT) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  SELECT tenant_id INTO v_tenant_id FROM public.users WHERE id = auth.uid();
  
  RETURN QUERY
  SELECT s.entry_date, s.row_index, s.content
  FROM public.schedule_entries s
  WHERE s.tenant_id = v_tenant_id
    AND s.entry_date >= p_start_date 
    AND s.entry_date <= p_end_date;
END;
$$;

-- RPC để lưu (upsert/delete) sự kiện lịch của user hiện tại
CREATE OR REPLACE FUNCTION public.save_schedule_entry_by_user(p_date DATE, p_row INTEGER, p_content TEXT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  SELECT tenant_id INTO v_tenant_id FROM public.users WHERE id = auth.uid();
  IF v_tenant_id IS NULL THEN
     RAISE EXCEPTION 'Tenant not found for user';
  END IF;

  IF p_content IS NULL OR trim(p_content) = '' THEN
     DELETE FROM public.schedule_entries
     WHERE tenant_id = v_tenant_id AND entry_date = p_date AND row_index = p_row;
  ELSE
     INSERT INTO public.schedule_entries(tenant_id, entry_date, row_index, content)
     VALUES (v_tenant_id, p_date, p_row, p_content)
     ON CONFLICT (tenant_id, entry_date, row_index)
     DO UPDATE SET content = EXCLUDED.content, updated_at = now();
  END IF;
END;
$$;

-- Cấp quyền execute
GRANT EXECUTE ON FUNCTION public.get_schedule_entries_by_user(DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_schedule_entry_by_user(DATE, INTEGER, TEXT) TO authenticated;

-- [KẾT THÚC SQL] --
