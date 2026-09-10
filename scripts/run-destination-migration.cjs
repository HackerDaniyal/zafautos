require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const postgres = require('postgres');
const fs = require('fs');

const connStr = process.env.DATABASE_URL;
if (!connStr) { console.error('ERROR: DATABASE_URL not set.'); process.exit(1); }
const client = postgres(connStr, { max: 1, ssl: 'require' });

async function main() {
  const sql = fs.readFileSync(require('path').resolve(__dirname, 'migration-destination-countries.sql'), 'utf8');
  await client.unsafe(sql);
  console.log('Migration completed successfully');
  
  // Verify
  const count = await client.unsafe('SELECT COUNT(*) as cnt FROM vehicle_destination_countries');
  console.log(`vehicle_destination_countries rows: ${count[0].cnt}`);
  
  const countryCounts = await client.unsafe(`
    SELECT c.name, COUNT(vdc.vehicle_id) as count
    FROM vehicle_destination_countries vdc
    JOIN countries c ON c.id = vdc.country_id
    GROUP BY c.name
    ORDER BY c.name
  `);
  for (const row of countryCounts) {
    console.log(`  ${row.name}: ${row.count} vehicles`);
  }
  
  await client.end();
}

main().catch((err) => { console.error('Migration failed:', err.message); process.exit(1); });
