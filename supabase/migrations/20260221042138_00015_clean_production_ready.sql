DO $$
BEGIN
  -- 1. Xóa các tài khoản phụ (Demo Staff, Client, Worker)
  DELETE FROM auth.users WHERE email IN ('staff@kikancloud.com', 'client@kikancloud.com', 'worker@kikancloud.com');

  -- 2. Dọn sạch rác dữ liệu ảo (Pristine State)
  DELETE FROM public.notifications;
  DELETE FROM public.messages;
  DELETE FROM public.client_documents;
  DELETE FROM public.worker_documents;
  DELETE FROM public.procedures;
  DELETE FROM public.audits;
  DELETE FROM public.workers;
  DELETE FROM public.companies;

  -- 3. Cập nhật tên Nghiệp đoàn mặc định thành tên chuẩn
  UPDATE public.tenants SET name = 'システム利用 監理団体' WHERE id = '22222222-2222-2222-2222-222222222222';

  -- 4. Đổi tên tài khoản Admin gốc thành admin@kikancloud.com
  UPDATE auth.users 
  SET email = 'admin@kikancloud.com',
      encrypted_password = crypt('admin123', gen_salt('bf'))
  WHERE email = 'demo@kikancloud.com';

  UPDATE auth.identities 
  SET identity_data = jsonb_set(identity_data, '{email}', '"admin@kikancloud.com"') 
  WHERE provider = 'email' AND identity_data->>'email' = 'demo@kikancloud.com';

  UPDATE public.users 
  SET full_name = 'システム管理者' 
  WHERE role = 'admin';

END $$;
