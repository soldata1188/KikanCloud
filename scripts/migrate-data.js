const { createClient } = require('@supabase/supabase-js')

// Local Supabase
const local = createClient('http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// Remote Supabase
const remote = createClient('https://gkrrdgjazvpkenjiwllh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdrcnJkZ2phenZwa2Vuaml3bGxoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTY2MzgxMSwiZXhwIjoyMDg3MjM5ODExfQ.vUX54_nVD2E_WSm3jJ3CFSoSMzEsfbXdmBDvoVjRhtQ',
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// Tenant & user mapping: local → remote
const LOCAL_TENANT = '11111111-1111-1111-1111-111111111111'
const REMOTE_TENANT = '005e394f-ec5e-48c3-a221-8a1bcedd65d7'
const LOCAL_USER = '99999999-9999-9999-9999-999999999999'
const REMOTE_USER = '164e964a-d314-4d16-9c2d-dee587d5f8d9'

function remap(rows) {
  return rows.map(row => {
    const r = { ...row }
    // Replace tenant_id
    if (r.tenant_id === LOCAL_TENANT) r.tenant_id = REMOTE_TENANT
    // Replace user references
    if (r.assigned_to === LOCAL_USER) r.assigned_to = REMOTE_USER
    if (r.uploaded_by === LOCAL_USER) r.uploaded_by = REMOTE_USER
    return r
  })
}

async function migrateTable(tableName, batchSize = 100) {
  console.log(`\nMigrating ${tableName}...`)

  let offset = 0
  let total = 0

  while (true) {
    const { data, error } = await local
      .from(tableName)
      .select('*')
      .range(offset, offset + batchSize - 1)

    if (error) {
      console.log(`  ❌ read error: ${error.message}`)
      break
    }
    if (!data || data.length === 0) break

    const remapped = remap(data)
    const { error: upsertErr } = await remote
      .from(tableName)
      .upsert(remapped, { onConflict: 'id', ignoreDuplicates: false })

    if (upsertErr) {
      console.log(`  ❌ upsert error: ${upsertErr.message}`)
      // Try inserting one by one to skip conflicts
      for (const row of remapped) {
        const { error: e2 } = await remote.from(tableName).upsert(row, { onConflict: 'id' })
        if (e2) console.log(`    skip ${row.id}: ${e2.message}`)
        else total++
      }
    } else {
      total += data.length
    }

    offset += batchSize
    if (data.length < batchSize) break
  }

  console.log(`  ✅ ${tableName}: ${total} rows migrated`)
}

async function run() {
  console.log('=== DATA MIGRATION: local → remote ===')
  console.log(`Tenant: ${LOCAL_TENANT} → ${REMOTE_TENANT}`)
  console.log(`User:   ${LOCAL_USER} → ${REMOTE_USER}`)

  // Ensure remote tenant exists
  const { error: te } = await remote.from('tenants').upsert({
    id: REMOTE_TENANT,
    name: 'ソリューション協同組合',
    org_type: 'kanri_dantai',
    status: 'active',
    is_deleted: false,
    updated_at: new Date().toISOString()
  }, { onConflict: 'id' })
  if (te) console.log('tenant upsert:', te.message)
  else console.log('\n✅ Tenant ensured')

  // Migrate in dependency order
  await migrateTable('companies')
  await migrateTable('workers')
  await migrateTable('audits')
  await migrateTable('exams')
  await migrateTable('job_transfers')
  await migrateTable('visas')
  await migrateTable('tasks')
  await migrateTable('worker_documents')

  // Verify
  console.log('\n=== VERIFY ===')
  for (const t of ['companies','workers','audits','exams','visas','tasks']) {
    const { count } = await remote.from(t).select('*', { count: 'exact', head: true })
    console.log(`  ${t}: ${count}`)
  }

  console.log('\n✅ Migration complete!')
}

run().catch(console.error)
