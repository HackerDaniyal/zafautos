require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
var postgres = require('postgres');
var client = postgres(process.env.DATABASE_URL, { max: 1, ssl: 'require' });

async function main() {
  var updates = [
    ['USD', '1.000000', '$'],
    ['JPY', '148.000000', '\u00a5'],
    ['EUR', '0.920000', '\u20ac'],
    ['GBP', '0.790000', '\u00a3'],
    ['AUD', '1.530000', 'A$'],
    ['CAD', '1.360000', 'CA$'],
    ['CHF', '0.880000', 'CHF'],
    ['CNY', '7.240000', '\u00a5'],
    ['INR', '83.500000', '\u20b9'],
    ['KRW', '1320.000000', '\u20a9'],
    ['AED', '3.670000', 'AED'],
    ['SGD', '1.340000', 'S$'],
  ];

  for (var u of updates) {
    await client.unsafe("UPDATE currencies SET exchange_rate = '" + u[1] + "', symbol = '" + u[2] + "' WHERE code = '" + u[0] + "'");
  }

  var rows = await client.unsafe('SELECT code, name, symbol, exchange_rate FROM currencies WHERE is_active = true ORDER BY code');
  for (var r of rows) {
    console.log(r.code + ' | ' + r.symbol + ' | rate=' + r.exchange_rate);
  }

  await client.end();
}
main().catch(function(e) { console.error(e.message); process.exit(1); });
