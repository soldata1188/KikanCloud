import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRole() {
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById('11111111-1111-1111-1111-111111111111'); // demo_user_id
    console.log("Auth User:", authUser?.user?.email, authError);

    const { data, error } = await supabase.from('users').select('*').limit(5);
    console.log("Public Users columns test", data?.[0], error);
}

checkRole();
