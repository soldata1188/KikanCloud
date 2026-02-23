-- Xóa dữ liệu cũ để tránh lỗi trùng lặp khi reset (Cascade sẽ tự động xóa các bảng con)
TRUNCATE TABLE public.job_transfers, public.exams, public.visas, public.workers, public.companies, public.audits, public.procedures, public.worker_documents, public.client_documents, public.messages, public.notifications CASCADE;

-- 1. Tạo 1 Nghiệp đoàn (Tenant)
INSERT INTO public.tenants (id, name, org_type, domain, status) 
VALUES ('11111111-1111-1111-1111-111111111111', 'Mirai Union (Demo)', 'kanri_dantai', 'mirai-demo', 'active')
ON CONFLICT (id) DO NOTHING;

-- 2. Tạo 2 Xí nghiệp (Company)
INSERT INTO public.companies (id, tenant_id, name_jp, corporate_number, address, representative) 
VALUES 
('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'Toyota Auto (Demo)', '1234567890123', 'Aichi, Japan', 'Taro Yamada'),
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Yamaha Kogyo (Demo)', '9876543210987', 'Tokyo, Japan', 'Hanako Suzuki');

-- 3. Tạo 3 Người lao động (Workers) với ID tĩnh
INSERT INTO public.workers (id, tenant_id, company_id, full_name_romaji, full_name_kana, dob, passport_exp, zairyu_no, entry_date, system_type, status) 
VALUES 
('33333333-3333-3333-3333-333333333331', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'NGUYEN VAN A', 'グエン ヴァン ア', '2000-01-01', CURRENT_DATE + INTERVAL '30 days', 'AB12345678CD', '2023-01-01', 'ikusei_shuro', 'working'),
('33333333-3333-3333-3333-333333333332', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'TRAN THI B', 'チャン ティ ビー', '2001-05-15', CURRENT_DATE + INTERVAL '2 years', 'XY98765432ZZ', '2024-04-01', 'ginou_jisshu', 'working'),
('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'LE VAN C', 'レ ヴァン シー', '1998-10-20', CURRENT_DATE + INTERVAL '5 months', 'MN11223344PQ', '2022-10-01', 'tokuteigino', 'working');

-- 4. Tạo 3 Hồ sơ Visa tương ứng (Visas)
INSERT INTO public.visas (id, tenant_id, worker_id, visa_type, expiration_date, process_status)
VALUES
('44444444-4444-4444-4444-444444444441', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', 'ikusei_shuro', CURRENT_DATE + INTERVAL '45 days', 'gathering'),
('44444444-4444-4444-4444-444444444442', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333332', 'tokuteigino', CURRENT_DATE + INTERVAL '1 year', 'approved'),
('44444444-4444-4444-4444-444444444443', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'tokuteigino', CURRENT_DATE + INTERVAL '6 months', 'gathering');

-- Bật extension mã hóa mật khẩu
CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- Xóa tài khoản cũ nếu có để tránh lỗi trùng lặp khi reset
DELETE FROM auth.users WHERE email = 'admin@mirai.com';
-- Tiêm tài khoản Auth (Mật khẩu: password123)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', '99999999-9999-9999-9999-999999999999', 'authenticated', 'authenticated', 'admin@mirai.com', crypt('password123', gen_salt('bf')), now(), now(), now());
-- Map tài khoản đó vào bảng users của SaaS (Gắn với Nghiệp đoàn Demo 11111111-1111-1111-1111-111111111111)
INSERT INTO public.users (id, tenant_id, full_name, role)
VALUES ('99999999-9999-9999-9999-999999999999', '11111111-1111-1111-1111-111111111111', 'Admin Mirai', 'admin')
ON CONFLICT DO NOTHING;
