require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const postgres = require('postgres');
const client = postgres(process.env.DATABASE_URL, { max: 1, ssl: 'require' });

async function main() {
  const currencies = await client.unsafe('SELECT id, code, name, symbol, exchange_rate, is_default, is_active FROM currencies ORDER BY code');
  console.log('=== CURRENCIES ===');
  for (const c of currencies) {
    console.log('  ' + c.code + ' | ' + c.name + ' | ' + c.symbol + ' | rate=' + c.exchange_rate + ' | default=' + c.is_default + ' | active=' + c.is_active);
  }

  const rates = await client.unsafe('SELECT * FROM exchange_rates LIMIT 10');
  console.log('\n=== EXCHANGE_RATES ===');
  console.log('  Rows: ' + rates.length);
  for (const r of rates) {
    console.log('  currencyId=' + r.currency_id + ' rate=' + r.rate);
  }

  const vdcCount = await client.unsafe('SELECT COUNT(*) as cnt FROM vehicle_destination_countries');
  console.log('\n=== VEHICLE_DESTINATION_COUNTRIES ===');
  console.log('  Total rows: ' + vdcCount[0].cnt);

  const countries = await client.unsafe("SELECT id, name, slug FROM countries WHERE name IN ('Australia', 'New Zealand', 'Pakistan', 'Myanmar', 'Bahrain', 'Japan') ORDER BY name");
  console.log('\n=== TARGET COUNTRIES ===');
  for (const c of countries) {
    console.log('  ' + c.name + ' | slug=' + c.slug + ' | id=' + c.id);
  }

  const vehicleCount = await client.unsafe('SELECT COUNT(DISTINCT vehicle_id) as cnt FROM vehicle_destination_countries');
  console.log('\nVehicles with destination mappings: ' + vehicleCount[0].cnt);

  const origins = await client.unsafe("SELECT c.name, COUNT(*) as cnt FROM vehicles v LEFT JOIN countries c ON c.id = v.country_id WHERE v.deleted_at IS NULL GROUP BY c.name");
  console.log('\n=== VEHICLE ORIGIN COUNTRIES (countryId) ===');
  for (const o of origins) {
    console.log('  ' + (o.name || 'NULL') + ': ' + o.cnt);
  }

  await client.end();
}
main().catch(function(e) { console.error(e.message); process.exit(1); });
