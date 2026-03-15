-- Cleanup orphaned auth.identities records for data@solutioncoop-jp.com
-- These may block the Admin API from creating the user even after auth.users is clean
DELETE FROM auth.identities
WHERE identity_data->>'email' = 'data@solutioncoop-jp.com';

-- Also cleanup any dangling sessions/tokens with no corresponding auth.users
DELETE FROM auth.sessions
WHERE user_id NOT IN (SELECT id FROM auth.users);

DELETE FROM auth.refresh_tokens
WHERE user_id NOT IN (SELECT id::text FROM auth.users);
