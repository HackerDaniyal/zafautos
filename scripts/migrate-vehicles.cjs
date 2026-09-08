const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });

const postgres = require('postgres');
const { createClient } = require('@supabase/supabase-js');

const DRY_RUN = process.argv.includes('--dry-run');

// ─── Config ───────────────────────────────────────────────────────────────────

const connStr = process.env.DATABASE_URL;
if (!connStr) { console.error('ERROR: DATABASE_URL not set.'); process.exit(1); }
const client = postgres(connStr, { max: 1, ssl: 'require' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) { console.error('ERROR: Supabase env vars missing.'); process.exit(1); }
const supabase = createClient(supabaseUrl, supabaseKey);

const CSV_PATH = path.resolve(__dirname, 'wp_posts.csv');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateSlug(input) {
  return input
    .toLowerCase()
    .replace(/[\u3000\u3001-\u303f\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff\uff00-\uffef]+/g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function decodeSlug(raw) {
  try {
    return decodeURIComponent(raw).replace(/[\u3000\u3001-\u303f\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff\uff00-\uffef]+/g, '-');
  } catch {
    return raw;
  }
}

// ─── CSV Parser (RFC 4180) ───────────────────────────────────────────────────

function parseCSV(text) {
  const rows = [];
  let current = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        field += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ',') {
        current.push(field);
        field = '';
        i++;
      } else if (ch === '\r') {
        i++;
        if (i < text.length && text[i] === '\n') i++;
        current.push(field);
        field = '';
        rows.push(current);
        current = [];
      } else if (ch === '\n') {
        i++;
        current.push(field);
        field = '';
        rows.push(current);
        current = [];
      } else {
        field += ch;
        i++;
      }
    }
  }

  if (field || current.length > 0) {
    current.push(field);
    rows.push(current);
  }

  return rows;
}

// ─── PHP Serialized Array Parser ──────────────────────────────────────────────

function parsePhpSerializedUrls(str) {
  if (!str || !str.startsWith('a:')) return [];

  const urls = [];
  const urlRegex = /https?:\/\/[^\s"\\]+/g;
  let match;
  while ((match = urlRegex.exec(str)) !== null) {
    urls.push(match[0]);
  }
  return urls;
}

// ─── Taxonomy Parser ──────────────────────────────────────────────────────────

function parseTaxonomies(raw) {
  if (!raw) return [];
  return raw.split(' | ').map(s => s.trim()).filter(Boolean);
}

// ─── Field Parsers ────────────────────────────────────────────────────────────

const FUEL_TYPE_ID_MAP = { 111: 'Petrol', 432: 'Gas', 78: 'Electric', 72: 'Diesel', 95: 'Hybrid' };
const TRANSMISSION_ID_MAP = { 47: 'Automatic', 437: 'Manual', 103: 'Manual', 69: 'CVT', 450: 'Automatic', 95: 'CVT' };
const MANUFACTURER_NAMES = [
  'Toyota', 'Honda', 'Nissan', 'Mazda', 'Subaru', 'Mitsubishi', 'Suzuki',
  'Lexus', 'Daihatsu', 'Isuzu', 'BMW', 'Audi', 'Volkswagen', 'Mercedes Benz',
  'Mercedes-Benz', 'Ford', 'Hyundai', 'Porsche',
];
// Approximate JPY->USD exchange rate for converting Yen-denominated prices.
const EXCHANGE_RATE_JPY_TO_USD = 148;
// Manual overrides for model-only titles whose manufacturer is absent from the
// title but is known (Nissan Clipper, Porsche Macan). The WP taxonomies contain
// noisy/irrelevant brand tags which must NOT be trusted for these vehicles.
const MANUFACTURER_OVERRIDES = {
  'clipper van': 'Nissan',
  'macan': 'Porsche',
  'freed hybrid': 'Honda',
};
const BODY_TYPE_NAMES = ['Sedan', 'SUV', 'Hatchback', 'Truck', 'Van', 'Coupe', 'Wagon', 'Minivan', 'MPV', 'Convertible', 'Tall Wagon'];
const COLOR_NAMES = ['Black', 'White', 'Silver', 'Blue', 'Green', 'Pearl', 'Red', 'Gun metallic', 'Grey', 'Purple', 'Yellow', 'Orange', 'Brown'];
const DRIVE_TYPE_MAP = {
  'Front-Wheel Drive': 'FWD',
  'All-Wheel Drive (AWD/4WD)': 'AWD',
  'Rear-Wheel Drive': 'RWD',
};
const DESTINATION_COUNTRIES = [
  'Japan', 'Africa', 'Asia', 'Europe', 'Australia', 'Oceania', 'Pakistan',
  'Ghana', 'South Africa', 'United Arab Emirates', 'United Kingdom',
  'Cambodia', 'Canada', 'Thailand', 'Nigeria', 'Kenya', 'Tanzania',
  'Uganda', 'Zambia', 'Zimbabwe', 'Mozambique', 'Malawi', 'Congo',
  'Rwanda', 'Botswana', 'Namibia',
];
const FEATURE_NAMES = [
  'Air Conditioner', 'Airbag', 'Anti-lock Braking', 'Alloy Wheels',
  'Apple CarPlay', 'Android Auto', 'Bluetooth', 'Brake Assist',
  'Child Safety Locks', 'Digital Odometer', 'Driver Air Bag',
  'Fog Lights Front', 'Heater', 'HomeLink', 'Leather Seats',
  'Navigation', 'Panoramic Moonroof', 'Power Door Locks', 'Power Steering',
  'Power Window', 'Rain Sensing Wiper', 'Rear Spoiler', 'Stability Control',
  'Tachometer', 'Television system', 'Touchscreen Display', 'Traction Control',
  'Vanity Mirror', 'Windows - Electric',
];

function parsePrice(raw) {
  if (!raw || raw === 'NULL' || raw === 'null') return null;
  const s = raw.trim();
  if (/ask\s*price/i.test(s)) return null;
  const cleaned = s.replace(/[^0-9.]/g, '');
  if (!cleaned) return null;
  const num = parseFloat(cleaned);
  if (isNaN(num)) return null;
  // Convert JPY to USD if the source price is denominated in Yen.
  if (/yen|円|jpy|¥/i.test(s)) {
    return Math.round(num / EXCHANGE_RATE_JPY_TO_USD);
  }
  return Math.round(num);
}

function parseYear(raw) {
  if (!raw || raw === 'NULL' || raw === 'null') return null;
  const n = parseInt(raw, 10);
  if (isNaN(n)) return null;
  if (n >= 1950 && n <= 2026) return n;
  // Short-hand years: 1-26 -> 2001-2026; larger short years -> 1900s (classic cars).
  if (n > 0 && n < 1950) {
    const future = 2000 + n;
    if (future <= 2026) return future;
    return 1900 + n;
  }
  return null;
}

function parseEngineCc(raw) {
  if (!raw || raw === 'NULL' || raw === 'null') return null;
  const s = raw.trim().toLowerCase().replace(/[^0-9]/g, '');
  if (!s) return null;
  const n = parseInt(s, 10);
  if (isNaN(n) || n === 0) return null;
  return n;
}

function parseMileage(raw) {
  if (!raw || raw === 'NULL' || raw === 'null') return null;
  const n = parseInt(raw, 10);
  return isNaN(n) ? null : n;
}

function parseVin(raw) {
  if (!raw || raw === 'NULL' || raw === 'null') return null;
  const s = raw.trim();
  if (/ask\s*for\s*it/i.test(s)) return null;
  if (!s) return null;
  return s.length > 50 ? s.substring(0, 50) : s;
}

function parseDoors(raw) {
  if (!raw || raw === 'NULL' || raw === 'null') return null;
  const n = parseInt(raw, 10);
  if (isNaN(n)) return null;
  if (n === 28 || n === 494 || n === 122) return null;
  if (n >= 2 && n <= 7) return n;
  return null;
}

function parseSeats(raw) {
  if (!raw || raw === 'NULL' || raw === 'null') return null;
  const match = raw.match(/(\d+)/);
  if (!match) return null;
  const n = parseInt(match[1], 10);
  return isNaN(n) ? null : n;
}

function parseCondition(raw, taxonomies) {
  if (taxonomies.includes('Used')) return 'Used';
  if (taxonomies.includes('New')) return 'New';
  if (raw === '147') return 'Used';
  return 'Used';
}

function extractManufacturer(title, taxonomies) {
  const normalized = title.toLowerCase().replace(/[\u3000-\u303f\uff00-\uffef]/g, ' ').trim();

  // Model-only titles with a known manufacturer take precedence over the noisy
  // WP taxonomy tags.
  const normalizedNoExtra = normalized.toLowerCase();
  for (const [key, mfg] of Object.entries(MANUFACTURER_OVERRIDES)) {
    if (normalizedNoExtra === key || normalizedNoExtra.startsWith(key + ' ') || normalizedNoExtra.startsWith(key + '-')) {
      return mfg;
    }
  }

  for (const mfg of MANUFACTURER_NAMES) {
    const lower = mfg.toLowerCase();
    if (normalized.startsWith(lower + ' ') || normalized.startsWith(lower)) {
      return mfg;
    }
  }

  for (const t of taxonomies) {
    if (MANUFACTURER_NAMES.map(m => m.toLowerCase()).includes(t.toLowerCase())) {
      return MANUFACTURER_NAMES.find(m => m.toLowerCase() === t.toLowerCase());
    }
  }

  return null;
}

function extractModel(title, manufacturer) {
  if (!manufacturer) return title.trim();

  let name = title.trim();

  const fullPattern = new RegExp(`^${manufacturer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'i');
  name = name.replace(fullPattern, '');

  // Convert full-width (halfwidth) letters and digits to half-width so model
  // designators like ＬＸ５７０ become "LX570" instead of being discarded.
  name = name.replace(/[\uFF01-\uFF5E]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0));

  const cjk = name.match(/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff]+/g);
  if (cjk) {
    for (const segment of cjk) {
      name = name.replace(segment, ' ');
    }
  }

  name = name.replace(/\s+/g, ' ').trim();

  if (!name) return 'Unknown';

  const noise = [
    '8 seater', '7-Seater', '7 Seater', '2000cc', 'Hybrid Double B',
    'EXCUTIVE', 'EXCUTIVE', '4WD', '4MATIC', 'AMG', 'line', 'LINE',
  ];
  for (const n of noise) {
    const re = new RegExp(n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    name = name.replace(re, ' ');
  }
  name = name.replace(/\s+/g, ' ').trim();

  return name || 'Unknown';
}

function extractFuelType(taxonomies) {
  for (const t of taxonomies) {
    const lower = t.toLowerCase();
    if (lower === 'petrol') return 'Petrol';
    if (lower === 'gas') return 'Gas';
    if (lower === 'electric') return 'Electric';
    if (lower === 'diesel') return 'Diesel';
    if (lower === 'hybrid') return 'Hybrid';
    if (lower === 'lpg') return 'LPG';
  }
  return null;
}

function extractTransmission(taxonomies) {
  for (const t of taxonomies) {
    const lower = t.toLowerCase();
    if (lower === 'automatic') return 'Automatic';
    if (lower === 'manual') return 'Manual';
    if (lower === 'cvt') return 'CVT';
    if (lower === 'semi-automatic') return 'Automatic';
  }
  return null;
}

function extractBodyType(taxonomies) {
  for (const t of taxonomies) {
    const matched = BODY_TYPE_NAMES.find(bt => bt.toLowerCase() === t.toLowerCase());
    if (matched) return matched;
  }
  if (taxonomies.includes('Car')) return 'Sedan';
  if (taxonomies.includes('Van')) return 'Van';
  return null;
}

function extractColor(taxonomies) {
  for (const t of taxonomies) {
    const matched = COLOR_NAMES.find(c => c.toLowerCase() === t.toLowerCase());
    if (matched) return matched;
  }
  return null;
}

function extractDriveType(taxonomies) {
  for (const t of taxonomies) {
    if (DRIVE_TYPE_MAP[t]) return DRIVE_TYPE_MAP[t];
  }
  return null;
}

function extractFeatures(taxonomies) {
  const features = [];
  for (const t of taxonomies) {
    if (FEATURE_NAMES.includes(t)) features.push(t);
  }
  return features;
}

function parseAddress(raw) {
  if (!raw || raw === 'NULL' || raw === 'null') return null;
  const s = raw.trim();
  if (!s) return null;
  return s;
}

function inferPortAndCountry(address) {
  if (!address) return { portName: null, countryName: 'Japan' };

  const lower = address.toLowerCase();

  if (lower.includes('yokohama')) return { portName: 'Port of Yokohama', countryName: 'Japan' };
  if (lower.includes('nagoya')) return { portName: 'Port of Nagoya', countryName: 'Japan' };
  if (lower.includes('tokyo')) return { portName: 'Port of Tokyo', countryName: 'Japan' };
  if (lower.includes('kobe')) return { portName: 'Port of Kobe', countryName: 'Japan' };
  if (lower.includes('osaka')) return { portName: 'Port of Osaka', countryName: 'Japan' };

  if (lower.includes('uss tokyo')) return { portName: 'USS Tokyo', countryName: 'Japan' };

  if (lower.includes('japan')) return { portName: 'Port of Tokyo', countryName: 'Japan' };

  return { portName: null, countryName: 'Japan' };
}

// ─── Main Migration ───────────────────────────────────────────────────────────

async function run() {
  const startTime = Date.now();
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  ZafAutos Japan — Vehicle Data Migration from WordPress');
  console.log('  Mode:', DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // ─── Phase 1: Parse CSV ─────────────────────────────────────────────────────

  console.log('Phase 1: Parsing CSV...');
  const csvText = fs.readFileSync(CSV_PATH, 'utf-8');
  const rawRows = parseCSV(csvText);
  const header = rawRows[0];
  const dataRows = rawRows.slice(1);

  const rows = dataRows.map(r => {
    const obj = {};
    header.forEach((h, i) => { obj[h] = r[i] || ''; });
    return obj;
  });

  const published = rows.filter(r => r.post_status === 'publish');
  const skipped = rows.filter(r => r.post_status !== 'publish');

  console.log(`  Total rows: ${rows.length}`);
  console.log(`  Published: ${published.length}`);
  console.log(`  Skipped (non-publish): ${skipped.length}`);
  if (skipped.length > 0) {
    for (const s of skipped) {
      console.log(`    - WP ID ${s.ID}: "${s.post_title}" (${s.post_status})`);
    }
  }
  console.log('');

  // ─── Phase 2: Resolve/Create Taxonomy Records ───────────────────────────────

  console.log('Phase 2: Resolving taxonomy records...');

  const taxonomyCache = {
    manufacturers: {},
    models: {},
    bodyTypes: {},
    fuelTypes: {},
    transmissions: {},
    driveTypes: {},
    colors: {},
    countries: {},
    ports: {},
  };

  async function getOrCreateRecord(table, nameField, name, extraFields = {}) {
    const key = name.toLowerCase();
    const cacheKey = table;
    if (taxonomyCache[cacheKey] && taxonomyCache[cacheKey][key]) {
      return taxonomyCache[cacheKey][key];
    }

    const existing = await client.unsafe(
      `SELECT id FROM ${table} WHERE lower(${nameField}) = $1 AND deleted_at IS NULL LIMIT 1`,
      [key]
    );

    if (existing.length > 0) {
      const id = existing[0].id;
      if (taxonomyCache[cacheKey]) taxonomyCache[cacheKey][key] = id;
      return id;
    }

    if (DRY_RUN) {
      const id = randomUUID();
      if (taxonomyCache[cacheKey]) taxonomyCache[cacheKey][key] = id;
      return id;
    }

    const id = randomUUID();
    const slug = generateSlug(name);
    // Only manufacturers, models, and countries have a slug column; other lookup tables do not.
    const hasSlug = table === 'manufacturers' || table === 'models' || table === 'countries';
    const fields = hasSlug
      ? { id, [nameField]: name, slug, ...extraFields }
      : { id, [nameField]: name, ...extraFields };
    const cols = Object.keys(fields);
    const vals = cols.map((_, i) => `$${i + 1}`);

    await client.unsafe(
      `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${vals.join(', ')}) ON CONFLICT DO NOTHING`,
      cols.map(c => fields[c])
    );

    if (taxonomyCache[cacheKey]) taxonomyCache[cacheKey][key] = id;
    return id;
  }

  // Pre-load existing reference data
  const existingMfgs = await client.unsafe('SELECT id, lower(name) as name FROM manufacturers WHERE deleted_at IS NULL');
  for (const m of existingMfgs) taxonomyCache.manufacturers[m.name] = m.id;

  const existingModels = await client.unsafe('SELECT id, lower(name) as name FROM models WHERE deleted_at IS NULL');
  for (const m of existingModels) taxonomyCache.models[m.name] = m.id;

  const existingBodyTypes = await client.unsafe('SELECT id, lower(name) as name FROM body_types WHERE deleted_at IS NULL');
  for (const b of existingBodyTypes) taxonomyCache.bodyTypes[b.name] = b.id;

  const existingFuelTypes = await client.unsafe('SELECT id, lower(name) as name FROM fuel_types WHERE deleted_at IS NULL');
  for (const f of existingFuelTypes) taxonomyCache.fuelTypes[f.name] = f.id;

  const existingTransmissions = await client.unsafe('SELECT id, lower(name) as name FROM transmissions WHERE deleted_at IS NULL');
  for (const t of existingTransmissions) taxonomyCache.transmissions[t.name] = t.id;

  const existingDriveTypes = await client.unsafe('SELECT id, lower(name) as name FROM drive_types WHERE deleted_at IS NULL');
  for (const d of existingDriveTypes) taxonomyCache.driveTypes[d.name] = d.id;

  const existingColors = await client.unsafe('SELECT id, lower(name) as name FROM colors WHERE deleted_at IS NULL');
  for (const c of existingColors) taxonomyCache.colors[c.name] = c.id;

  const existingCountries = await client.unsafe('SELECT id, lower(name) as name FROM countries WHERE deleted_at IS NULL');
  for (const c of existingCountries) taxonomyCache.countries[c.name] = c.id;

  const existingPorts = await client.unsafe('SELECT id, lower(name) as name FROM ports WHERE deleted_at IS NULL');
  for (const p of existingPorts) taxonomyCache.ports[p.name] = p.id;

  const existingCurrencies = await client.unsafe("SELECT id FROM currencies WHERE code = 'USD' AND deleted_at IS NULL LIMIT 1");
  const defaultCurrencyId = existingCurrencies.length > 0 ? existingCurrencies[0].id : null;

  console.log(`  Loaded: ${existingMfgs.length} manufacturers, ${existingModels.length} models, ${existingBodyTypes.length} body types`);
  console.log(`  Loaded: ${existingFuelTypes.length} fuel types, ${existingTransmissions.length} transmissions, ${existingDriveTypes.length} drive types`);
  console.log(`  Loaded: ${existingColors.length} colors, ${existingCountries.length} countries, ${existingPorts.length} ports`);
  console.log('');

  // ─── Phase 3: Delete Existing Seeded Vehicles ───────────────────────────────

  if (!DRY_RUN) {
    console.log('Phase 3: Cleaning up existing vehicle data...');
    const cleanupTables = [
      'vehicle_specifications', 'vehicle_features', 'vehicle_documents',
      'vehicle_videos', 'vehicle_images', 'vehicle_status', 'vehicles',
    ];
    for (const t of cleanupTables) {
      try {
        await client.unsafe(`DELETE FROM ${t}`);
        console.log(`  Cleared ${t}`);
      } catch (e) {
        console.log(`  SKIP ${t}: ${e.message.substring(0, 60)}`);
      }
    }
    console.log('');
  } else {
    console.log('Phase 3: [DRY RUN] Would clean existing vehicle data.\n');
  }

  // ─── Phase 4: Import Vehicle Records ────────────────────────────────────────

  console.log('Phase 4: Importing vehicle records...');

  const usedSlugs = new Set();
  const vehicleResults = [];
  let importCount = 0;
  let errorCount = 0;

  for (const row of published) {
    try {
      const wpId = row.ID;
      const title = row.post_title;
      const taxonomies = parseTaxonomies(row.taxonomies);

      const manufacturer = extractManufacturer(title, taxonomies);
      const model = extractModel(title, manufacturer);

      let manufacturerId = null;
      if (manufacturer) {
        manufacturerId = await getOrCreateRecord('manufacturers', 'name', manufacturer);
      }

      let modelId = null;
      if (model && model !== 'Unknown' && manufacturerId) {
        const modelSlug = generateSlug(`${manufacturer}-${model}`);
        const existingModel = await client.unsafe(
          'SELECT id FROM models WHERE lower(name) = $1 AND deleted_at IS NULL LIMIT 1',
          [model.toLowerCase()]
        );
        if (existingModel.length > 0) {
          modelId = existingModel[0].id;
        } else if (!DRY_RUN) {
          modelId = randomUUID();
          await client.unsafe(
            'INSERT INTO models (id, manufacturer_id, name, slug) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
            [modelId, manufacturerId, model, modelSlug]
          );
        } else {
          modelId = randomUUID();
        }
        if (taxonomyCache.models[model.toLowerCase()]) {
          // already cached
        } else {
          taxonomyCache.models[model.toLowerCase()] = modelId;
        }
      }

      const fuelType = extractFuelType(taxonomies) || FUEL_TYPE_ID_MAP[parseInt(row.fuel_type)] || null;
      let fuelTypeId = null;
      if (fuelType) {
        fuelTypeId = await getOrCreateRecord('fuel_types', 'name', fuelType);
      }

      const transmission = extractTransmission(taxonomies) || TRANSMISSION_ID_MAP[parseInt(row.transmission)] || null;
      let transmissionId = null;
      if (transmission) {
        transmissionId = await getOrCreateRecord('transmissions', 'name', transmission);
      }

      const bodyType = extractBodyType(taxonomies);
      let bodyTypeId = null;
      if (bodyType) {
        bodyTypeId = await getOrCreateRecord('body_types', 'name', bodyType);
      }

      const color = extractColor(taxonomies);
      let colorId = null;
      if (color) {
        colorId = await getOrCreateRecord('colors', 'name', color);
      }

      const driveType = extractDriveType(taxonomies);
      let driveTypeId = null;
      if (driveType) {
        driveTypeId = await getOrCreateRecord('drive_types', 'name', driveType);
      }

      const year = parseYear(row.year);
      const engineCc = parseEngineCc(row.engine_size);
      const mileageVal = parseMileage(row.mileage);
      const vin = parseVin(row.vin);
      const doors = parseDoors(row.doors);
      const seats = parseSeats(row.seats);
      const price = parsePrice(row.price);
      const condition = parseCondition(row.vehicle_condition, taxonomies);

      const address = parseAddress(row.address);
      const { portName, countryName } = inferPortAndCountry(address);

      let portId = null;
      if (portName) {
        portId = await getOrCreateRecord('ports', 'name', portName);
      }

      let countryId = null;
      if (countryName) {
        countryId = await getOrCreateRecord('countries', 'name', countryName);
      }

      // Slug generation
      let slug = row.slug;
      if (/^\d+$/.test(slug)) {
        const mfgSlug = manufacturer ? generateSlug(manufacturer) : 'unknown';
        const modelSlug2 = model && model !== 'Unknown' ? generateSlug(model) : 'unknown';
        slug = generateSlug(`${year || '0000'}-${mfgSlug}-${modelSlug2}`);
      } else {
        slug = generateSlug(decodeSlug(slug));
      }

      if (!slug || slug === 'auto-draft') {
        const mfgSlug = manufacturer ? generateSlug(manufacturer) : 'unknown';
        const modelSlug2 = model && model !== 'Unknown' ? generateSlug(model) : 'unknown';
        slug = generateSlug(`${year || '0000'}-${mfgSlug}-${modelSlug2}`);
      }

      let slugSuffix = '';
      let slugAttempt = 0;
      while (usedSlugs.has(slug + slugSuffix)) {
        slugAttempt++;
        slugSuffix = `-${slugAttempt + 1}`;
      }
      slug = slug + slugSuffix;
      usedSlugs.add(slug);

      // Insert vehicle
      const vehicleId = randomUUID();

      if (!DRY_RUN) {
        await client.unsafe(`
          INSERT INTO vehicles (
            id, vin, stock_number, manufacturer_id, model_id, body_type_id,
            fuel_type_id, transmission_id, drive_type_id, color_id,
            year, engine_cc, mileage, doors, seats, price, currency_id,
            condition, port_id, country_id, status, slug, is_featured,
            created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10,
            $11, $12, $13, $14, $15, $16, $17,
            $18, $19, $20, 'active', $21, false,
            NOW(), NOW()
          )
        `, [
          vehicleId, vin, `WP-${wpId}`,
          manufacturerId, modelId, bodyTypeId,
          fuelTypeId, transmissionId, driveTypeId, colorId,
          year, engineCc, mileageVal, doors, seats, price, defaultCurrencyId,
          condition, portId, countryId, slug,
        ]);
      }

      // Vehicle specifications (WordPress metadata)
      const specs = [
        { name: 'WordPress ID', value: wpId },
        { name: 'WordPress Slug', value: row.slug },
      ];
      if (row.post_date && row.post_date !== 'NULL') {
        specs.push({ name: 'WordPress Post Date', value: row.post_date });
      }
      if (row.gallery_urls && row.gallery_urls !== 'NULL') {
        specs.push({ name: 'Original Gallery URLs', value: row.gallery_urls });
      }

      if (!DRY_RUN) {
        for (const spec of specs) {
          await client.unsafe(
            'INSERT INTO vehicle_specifications (id, vehicle_id, name, value) VALUES ($1, $2, $3, $4)',
            [randomUUID(), vehicleId, spec.name, spec.value]
          );
        }
      }

      // Vehicle features
      const features = extractFeatures(taxonomies);
      if (!DRY_RUN) {
        for (const feature of features) {
          await client.unsafe(
            'INSERT INTO vehicle_features (id, vehicle_id, name) VALUES ($1, $2, $3)',
            [randomUUID(), vehicleId, feature]
          );
        }
      }

      // Gallery URLs
      const galleryUrls = parsePhpSerializedUrls(row.gallery_urls);

      vehicleResults.push({
        vehicleId,
        wpId,
        title,
        slug,
        galleryUrls,
        manufacturer,
        model,
        price,
        year,
        mileage: mileageVal,
        vin,
      });

      importCount++;
    } catch (e) {
      console.error(`  ERROR WP ID ${row.ID}: ${e.message}`);
      errorCount++;
    }
  }

  console.log(`  Imported: ${importCount} vehicles`);
  console.log(`  Errors: ${errorCount}`);
  console.log('');

  // ─── Phase 5: Download/Upload Media ─────────────────────────────────────────

  console.log('Phase 5: Downloading and uploading vehicle images...');

  let totalImages = 0;
  let uploadedImages = 0;
  let failedImages = 0;

  async function downloadImage(url, retries = 2) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(url, {
          signal: controller.signal,
          headers: { 'User-Agent': 'ZafAutos-Migration/1.0' },
          redirect: 'follow',
        });
        clearTimeout(timeout);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const contentType = response.headers.get('content-type') || '';
        const buffer = Buffer.from(await response.arrayBuffer());

        let ext = 'jpg';
        if (contentType.includes('png')) ext = 'png';
        else if (contentType.includes('webp')) ext = 'webp';
        else if (contentType.includes('gif')) ext = 'gif';
        else if (url.endsWith('.png')) ext = 'png';
        else if (url.endsWith('.webp')) ext = 'webp';
        else if (url.endsWith('.gif')) ext = 'gif';

        return { buffer, ext, contentType: contentType.split(';')[0].trim() || 'image/jpeg' };
      } catch (e) {
        if (attempt === retries) throw e;
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }

  for (const v of vehicleResults) {
    if (v.galleryUrls.length === 0) continue;

    for (let i = 0; i < v.galleryUrls.length; i++) {
      totalImages++;
      const url = v.galleryUrls[i];

      try {
        if (DRY_RUN) {
          if (/^https?:\/\//i.test(url)) uploadedImages++; else failedImages++;
          continue;
        }

        const { buffer, ext, contentType } = await downloadImage(url);
        const storagePath = `${v.vehicleId}/${randomUUID()}.${ext}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('vehicles')
          .upload(storagePath, buffer, { contentType, upsert: false });

        if (uploadError) {
          console.log(`  UPLOAD FAIL [${v.wpId}] ${url}: ${uploadError.message}`);
          failedImages++;
          continue;
        }

        const publicUrl = `${supabaseUrl}/storage/v1/object/public/vehicles/${uploadData.path}`;

        await client.unsafe(
          'INSERT INTO vehicle_images (id, vehicle_id, image_url, sort_order, is_primary) VALUES ($1, $2, $3, $4, $5)',
          [randomUUID(), v.vehicleId, publicUrl, i, i === 0]
        );

        uploadedImages++;
      } catch (e) {
        console.log(`  DOWNLOAD FAIL [${v.wpId}] ${url}: ${e.message.substring(0, 80)}`);
        failedImages++;
      }
    }
  }

  console.log(`  Total images: ${totalImages}`);
  console.log(`  Uploaded: ${uploadedImages}`);
  console.log(`  Failed: ${failedImages}`);
  console.log('');

  // ─── Phase 6: Verification ──────────────────────────────────────────────────

  console.log('Phase 6: Verification...\n');

  if (!DRY_RUN) {
    const vCount = await client.unsafe('SELECT count(*)::int as count FROM vehicles WHERE stock_number LIKE $1', ['WP-%']);
    const imgCount = await client.unsafe('SELECT count(*)::int as count FROM vehicle_images WHERE vehicle_id IN (SELECT id FROM vehicles WHERE stock_number LIKE $1)', ['WP-%']);
    const specCount = await client.unsafe('SELECT count(*)::int as count FROM vehicle_specifications WHERE vehicle_id IN (SELECT id FROM vehicles WHERE stock_number LIKE $1)', ['WP-%']);
    const featCount = await client.unsafe('SELECT count(*)::int as count FROM vehicle_features WHERE vehicle_id IN (SELECT id FROM vehicles WHERE stock_number LIKE $1)', ['WP-%']);

    console.log('  Database Counts:');
    console.log(`    Vehicles: ${vCount[0].count}`);
    console.log(`    Images: ${imgCount[0].count}`);
    console.log(`    Specifications: ${specCount[0].count}`);
    console.log(`    Features: ${featCount[0].count}`);
    console.log('');

    const sampleVehicles = await client.unsafe(`
      SELECT v.id, v.slug, v.year, v.price, v.status, v.condition,
             m.name as manufacturer, md.name as model,
             ft.name as fuel_type, t.name as transmission,
             v.stock_number
      FROM vehicles v
      LEFT JOIN manufacturers m ON v.manufacturer_id = m.id
      LEFT JOIN models md ON v.model_id = md.id
      LEFT JOIN fuel_types ft ON v.fuel_type_id = ft.id
      LEFT JOIN transmissions t ON v.transmission_id = t.id
      WHERE v.stock_number LIKE $1
      ORDER BY v.created_at DESC
      LIMIT 5
    `, ['WP-%']);

    console.log('  Sample Vehicles:');
    for (const v of sampleVehicles) {
      console.log(`    ${v.stock_number} | ${v.manufacturer || '?'} ${v.model || '?'} | ${v.year || '?'} | $${v.price || '?'} | ${v.condition} | ${v.status}`);
    }
  } else {
    console.log('  [DRY RUN] No database verification.');
  }

  console.log('');

  // ─── Report ─────────────────────────────────────────────────────────────────

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  MIGRATION REPORT');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log(`  CSV Rows: ${rows.length} (published: ${published.length})`);
  console.log(`  Vehicles Imported: ${importCount}`);
  console.log(`  Import Errors: ${errorCount}`);
  console.log(`  Images Uploaded: ${uploadedImages}`);
  console.log(`  Image Upload Failures: ${failedImages}`);
  console.log(`  Total Image URLs: ${totalImages}`);
  console.log(`  Time: ${elapsed}s`);

  const uniqueManufacturers = new Set(vehicleResults.map(v => v.manufacturer).filter(Boolean));
  const uniqueModels = new Set(vehicleResults.map(v => v.model).filter(Boolean));
  const pricedVehicles = vehicleResults.filter(v => v.price !== null);
  const avgPrice = pricedVehicles.length > 0
    ? Math.round(pricedVehicles.reduce((sum, v) => sum + v.price, 0) / pricedVehicles.length)
    : 0;

  console.log('');
  console.log(`  Unique Manufacturers: ${uniqueManufacturers.size} (${[...uniqueManufacturers].join(', ')})`);
  console.log(`  Unique Models: ${uniqueModels.size}`);
  console.log(`  Vehicles with Price: ${pricedVehicles.length} (avg: $${avgPrice})`);
  console.log(`  Vehicles with VIN: ${vehicleResults.filter(v => v.vin).length}`);
  console.log(`  Vehicles with Images: ${vehicleResults.filter(v => v.galleryUrls.length > 0).length}`);
  console.log('═══════════════════════════════════════════════════════════════');

  await client.end();
  process.exit(0);
}

run().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
