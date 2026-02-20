const { execSync } = require('child_process');
execSync(`docker exec supabase_db_kikan-saas psql -U postgres -d postgres -c "UPDATE public.users SET full_name='デモ管理者 (Admin)' WHERE id='11111111-1111-1111-1111-111111111111'; UPDATE auth.users SET raw_user_meta_data='{\\"full_name\\":\\"デモ管理者 (Admin)\\"}' WHERE id='11111111-1111-1111-1111-111111111111';"`);
execSync(`docker exec supabase_db_kikan-saas psql -U postgres -d postgres -c "UPDATE public.tenants SET name='KikanCloud 協同組合 (DEMO)' WHERE id='22222222-2222-2222-2222-222222222222';"`);
