ALTER TABLE public.users ADD COLUMN IF NOT EXISTS login_id VARCHAR(255);
-- Update user cũ (nếu có) bằng cách lấy phần trước @ của email từ auth.users
UPDATE public.users 
SET login_id = SPLIT_PART(au.email, '@', 1) 
FROM auth.users au 
WHERE public.users.id = au.id AND public.users.login_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_login_id ON public.users(login_id);
