'use server'

import { createClient } from '@supabase/supabase-js'

export async function inviteUser(email: string) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('Missing Supabase Service Role Key or URL');
    }

    // Initialize Supabase Admin Client using the Service Role Key
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );

    // Call Supabase Admin API to invite user by email
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/update-password`
    });

    if (error) {
        throw new Error(error.message);
    }

    return { success: true, user: data.user };
}
