const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://gkrrdgjazvpkenjiwllh.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdrcnJkZ2phenZwa2Vuaml3bGxoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTY2MzgxMSwiZXhwIjoyMDg3MjM5ODExfQ.vUX54_nVD2E_WSm3jJ3CFSoSMzEsfbXdmBDvoVjRhtQ'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const TARGET_EMAIL = 'data@solutioncoop-jp.com'
const TENANT_ID = '005e394f-ec5e-48c3-a221-8a1bcedd65d7'

async function run() {
  console.log('=== STEP 1: Create auth user via Admin API ===')
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email: TARGET_EMAIL,
    password: 'pavaca2503',
    email_confirm: true,
    user_metadata: { full_name: 'Admin' }
  })

  if (createErr) {
    console.log('❌ createUser error:', createErr.message)
    return
  }

  const userId = created.user.id
  console.log('✅ auth user created:', userId)

  console.log('\n=== STEP 2: Upsert public.users ===')
  const { error: upsertErr } = await supabase
    .from('users')
    .upsert({
      id: userId,
      tenant_id: TENANT_ID,
      role: 'admin',
      full_name: 'Admin',
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' })

  if (upsertErr) {
    console.log('❌ public.users upsert error:', upsertErr.message)
  } else {
    console.log('✅ public.users upserted')
  }

  console.log('\n=== STEP 3: Verify ===')
  const { data: pubUser } = await supabase
    .from('users')
    .select('id, tenant_id, role, full_name')
    .eq('id', userId)
    .single()
  console.log('public.users:', pubUser)

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name, org_type, status')
    .eq('id', TENANT_ID)
    .single()
  console.log('tenant:', tenant)

  console.log('\n✅ DONE')
  console.log('Email:    ', TARGET_EMAIL)
  console.log('Password:  pavaca2503')
  console.log('User ID:  ', userId)
  console.log('Login:     https://kikan-cloud.vercel.app/login')
}

run().catch(console.error)
