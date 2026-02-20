const { execSync } = require('child_process');
const r = execSync(`docker exec supabase_db_kikan-saas psql -U postgres -d postgres -t -c "SELECT row_to_json(u) FROM auth.users u WHERE email='demo@kikancloud.com';"`);
console.log(JSON.stringify(JSON.parse(r.toString()), null, 2));
