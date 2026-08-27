const postgres = require('postgres');
const connStr = 'postgresql://postgres.REMOVED_PROJECT_REF:REMOVED_DB_PASS@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';
const client = postgres(connStr, { max: 1, ssl: 'require' });

async function run() {
  const roles = await client.unsafe("SELECT id, name FROM roles");
  console.log('Roles:', roles.map(r => r.name + ' (' + r.id.substring(0, 8) + ')').join(', '));
  
  const [perm] = await client.unsafe("SELECT id FROM permissions WHERE slug = 'notifications.read'");
  if (!perm) { console.log('Permission not found'); await client.end(); return; }
  
  for (const role of roles) {
    await client.unsafe("INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [role.id, perm.id]);
    console.log('Assigned to:', role.name);
  }
  
  await client.end();
}

run().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
