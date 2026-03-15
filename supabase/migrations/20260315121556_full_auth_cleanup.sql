-- Full cleanup of all broken auth records for data@solutioncoop-jp.com
-- This resets the state so the Admin API can create the user cleanly
DO $$
DECLARE
  v_email TEXT := 'data@solutioncoop-jp.com';
  v_ids UUID[];
BEGIN
  -- Collect all user IDs for this email
  SELECT ARRAY(SELECT id FROM auth.users WHERE email = v_email) INTO v_ids;
  RAISE NOTICE 'Found % auth user(s) to clean up', array_length(v_ids, 1);

  -- Delete dependent records in correct order
  DELETE FROM auth.mfa_amr_claims WHERE session_id IN (
    SELECT id FROM auth.sessions WHERE user_id = ANY(v_ids)
  );
  DELETE FROM auth.mfa_challenges WHERE factor_id IN (
    SELECT id FROM auth.mfa_factors WHERE user_id = ANY(v_ids)
  );
  DELETE FROM auth.mfa_factors WHERE user_id = ANY(v_ids);
  DELETE FROM auth.sessions WHERE user_id = ANY(v_ids);
  DELETE FROM auth.refresh_tokens WHERE user_id::text = ANY(SELECT id::text FROM auth.users WHERE email = v_email);
  DELETE FROM auth.identities WHERE user_id = ANY(v_ids);
  -- Skip audit_log_entries (schema varies by Supabase version)

  -- Clean public.users
  DELETE FROM public.users WHERE id = ANY(v_ids);

  -- Finally delete from auth.users
  DELETE FROM auth.users WHERE email = v_email;

  RAISE NOTICE 'Cleanup complete for %', v_email;
END;
$$;
