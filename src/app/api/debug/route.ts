import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Diagnostic endpoint: only available in development
export async function GET() {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Not Found' }, { status: 404 })
    }

    const results: Record<string, any> = {
        timestamp: new Date().toISOString(),
        checks: {},
    }

    try {
        // 1. Create Supabase client
        const supabase = await createClient()
        results.checks['supabase_client'] = 'OK'

        // 2. Get user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        results.checks['auth'] = authError ? `ERROR: ${authError.message}` : (user ? `OK (${user.id})` : 'NO USER')

        if (!user) {
            return NextResponse.json({ ...results, conclusion: 'Not authenticated' })
        }

        // 3. Get user profile
        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('full_name, role, tenant_id')
            .eq('id', user.id)
            .single()
        results.checks['profile'] = profileError ? `ERROR: ${profileError.message}` : (profile ? 'OK' : 'NULL')
        results.profile = profile

        // 4. Fetch workers with companies join (this is what /workers/page.tsx does)
        const { data: workers, error: workersError } = await supabase
            .from('workers')
            .select('*, companies(name_jp)')
            .eq('is_deleted', false)
            .order('created_at', { ascending: false })
            .limit(5)
        results.checks['workers_query'] = workersError ? `ERROR: ${workersError.message}` : `OK (${workers?.length || 0} rows)`
        if (workersError) results.workers_error_details = workersError

        // 5. Fetch companies with workers join (this is what /companies/page.tsx does)
        const { data: companies, error: companiesError } = await supabase
            .from('companies')
            .select('*, workers(id, status, is_deleted, visa_status, full_name_romaji, full_name_kana, avatar_url, entry_date, zairyu_exp)')
            .eq('is_deleted', false)
            .limit(5)
        results.checks['companies_query'] = companiesError ? `ERROR: ${companiesError.message}` : `OK (${companies?.length || 0} rows)`
        if (companiesError) results.companies_error_details = companiesError

        // 6. Fetch dashboard data (this is what /page.tsx does)
        if (profile?.tenant_id) {
            const { data: dashWorkers, error: dashError } = await supabase
                .from('workers')
                .select('id, full_name_romaji, nationality, status, residence_card_exp_date, passport_exp_date, industry_field, companies(name_jp)')
                .eq('tenant_id', profile.tenant_id)
                .eq('is_deleted', false)
                .limit(5)
            results.checks['dashboard_query'] = dashError ? `ERROR: ${dashError.message}` : `OK (${dashWorkers?.length || 0} rows)`
            if (dashError) results.dashboard_error_details = dashError

            // Show sample worker data to check for problematic fields
            if (dashWorkers && dashWorkers.length > 0) {
                results.sample_worker = dashWorkers[0]
            }
        }

        // 7. Check if unique constraint exists (needed for upsert)
        const { error: upsertTestError } = await supabase
            .from('workers')
            .select('id')
            .limit(1)
        results.checks['workers_table_access'] = upsertTestError ? `ERROR: ${upsertTestError.message}` : 'OK'

        results.conclusion = 'All checks completed'

    } catch (e: any) {
        results.fatal_error = e.message
        results.fatal_stack = e.stack
    }

    return NextResponse.json(results, { status: 200 })
}
