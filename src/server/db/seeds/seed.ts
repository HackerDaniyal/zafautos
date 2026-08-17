import { config } from 'dotenv';
config({ path: '.env.local' });

/**
 * ZafAutos Japan — Database Seed Script
 *
 * Usage: npx tsx src/server/db/seeds/seed.ts
 *
 * Generates realistic demo data for development:
 * - Reference data (manufacturers, models, body types, etc.)
 * - Users (admin, dealer, customer)
 * - Vehicles with images, features, specifications
 * - Orders, payments, shipments
 * - Messages, notifications, analytics
 */

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '@/server/db/schema';
import {
  randomItem,
  randomIntRange,
  generateSlug,
  generateVin,
  generateStockNumber,
  generateEmail,
  generatePhone,
  uuid,
  daysAgo,
  monthsAgo,
  resetUsedEmails,
  resetUsedVins,
} from './utils';

// ─── Database Connection ──────────────────────────────────────────────────────

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { max: 10 });
const db = drizzle(sql, { schema });

// ─── Reference Data ───────────────────────────────────────────────────────────

const MANUFACTURERS = [
  { name: 'Toyota', slug: 'toyota' },
  { name: 'Honda', slug: 'honda' },
  { name: 'Nissan', slug: 'nissan' },
  { name: 'Mazda', slug: 'mazda' },
  { name: 'Subaru', slug: 'subaru' },
  { name: 'Mitsubishi', slug: 'mitsubishi' },
  { name: 'Suzuki', slug: 'suzuki' },
  { name: 'Lexus', slug: 'lexus' },
  { name: 'Daihatsu', slug: 'daihatsu' },
  { name: 'Isuzu', slug: 'isuzu' },
];

const MODELS: Record<string, string[]> = {
  toyota: ['Corolla', 'Camry', 'RAV4', 'Hilux', 'Land Cruiser', 'Yaris'],
  honda: ['Civic', 'Accord', 'CR-V', 'Fit', 'Vezel', 'Stepwgn'],
  nissan: ['Note', 'Serena', 'X-Trail', 'Leaf', 'Skyline', 'Kicks'],
  mazda: ['Mazda3', 'Mazda6', 'CX-5', 'CX-3', 'Demio', 'CX-50'],
  subaru: ['Impreza', 'Forester', 'Outback', 'XV', 'Levorg'],
  mitsubishi: ['Outlander', 'Pajero', 'Lancer', 'Delica', 'Xpander'],
  suzuki: ['Swift', 'Jimny', 'Alto', 'Spacia', 'Wagon R'],
  lexus: ['RX', 'NX', 'IS', 'ES', 'UX', 'LX'],
  daihatsu: ['Tanto', 'Move', 'Hijet', ' Rocky', 'Taft'],
  isuzu: ['D-Max', 'MU-X', 'N-Series', 'F-Series'],
};

const BODY_TYPES = ['Sedan', 'SUV', 'Hatchback', 'Truck', 'Van', 'Coupe', 'Wagon', 'Minivan'];
const FUEL_TYPES = ['Petrol', 'Diesel', 'Hybrid', 'Electric', 'LPG'];
const TRANSMISSIONS = ['Automatic', 'Manual', 'CVT'];
const DRIVE_TYPES = ['FWD', 'RWD', 'AWD'];
const COLORS = ['White', 'Black', 'Silver', 'Red', 'Blue', 'Grey', 'Green', 'Yellow', 'Orange', 'Brown'];
const COUNTRIES = [
  { name: 'Japan', code: 'JP' },
  { name: 'Kenya', code: 'KE' },
  { name: 'Tanzania', code: 'TZ' },
  { name: 'Uganda', code: 'UG' },
  { name: 'Nigeria', code: 'NG' },
  { name: 'Ghana', code: 'GH' },
  { name: 'South Africa', code: 'ZA' },
  { name: 'Zambia', code: 'ZM' },
  { name: 'Zimbabwe', code: 'ZW' },
  { name: 'Mozambique', code: 'MZ' },
  { name: 'Malawi', code: 'MW' },
  { name: 'Congo', code: 'CD' },
  { name: 'Rwanda', code: 'RW' },
  { name: 'Botswana', code: 'BW' },
  { name: 'Namibia', code: 'NA' },
];
const PORTS = [
  { name: 'Port of Yokohama', code: 'YOK' },
  { name: 'Port of Kobe', code: 'KOB' },
  { name: 'Port of Nagoya', code: 'NAG' },
  { name: 'Port of Tokyo', code: 'TYO' },
  { name: 'Port of Osaka', code: 'OSA' },
];
const CURRENCIES = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'KES', name: 'Kenyan Shilling' },
];
const AUCTION_GRADES = ['3.5', '4', '4.5', '5', 'S', 'R'];
const CONDITIONS = ['Excellent', 'Good', 'Fair'];

const FIRST_NAMES = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Ahmed', 'Fatima', 'Omar', 'Amina', 'Ali', 'Zainab', 'Hassan', 'Khadija', 'Ibrahim', 'Maryam'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Mwangi', 'Odhiambo', 'Kamau', 'Njoroge', 'Ochieng', 'Wanjiku', 'Otieno', 'Nyongesa', 'Mbugua', 'Kariuki'];

// ─── Seed Functions ───────────────────────────────────────────────────────────

async function clearDatabase() {
  console.log('🗑️  Clearing existing data...');
  await sql.unsafe(`TRUNCATE TABLE
    "analytics_events", "page_views", "search_history",
    "vehicle_views", "vehicle_compare", "vehicle_wishlist", "vehicle_enquiries", "featured_vehicles",
    "email_logs", "notifications", "message_threads", "messages",
    "shipping_documents", "containers", "shipment_tracking", "shipments",
    "payment_history", "payment_methods", "invoices", "payments", "exchange_rates", "currencies",
    "order_notes", "order_documents", "order_timeline", "order_status", "order_items", "orders",
    "dealer_activity", "dealer_assignments", "dealer_profiles", "dealers",
    "customer_alerts", "customer_wishlist", "customer_addresses", "customer_settings", "customer_profiles", "customers",
    "vehicle_specifications", "vehicle_features", "vehicle_documents", "vehicle_videos", "vehicle_images", "vehicle_status", "vehicles",
    "body_types", "fuel_types", "transmissions", "drive_types", "colors", "manufacturers", "models", "ports",
    "document_versions", "documents", "document_categories",
    "profiles", "role_permissions", "permissions", "roles", "users",
    "email_templates", "system_settings", "site_settings", "languages", "countries"
    CASCADE`);
  console.log('✅ Database cleared');
}

async function seedReferenceData() {
  console.log('📋 Seeding reference data...');

  // Countries
  const countryIds: string[] = [];
  for (const c of COUNTRIES) {
    const id = uuid();
    countryIds.push(id);
    await db.insert(schema.countries).values({ name: c.name, slug: c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }).onConflictDoNothing();
  }

  // Languages
  const langIds: string[] = [];
  for (const lang of [{ name: 'English', code: 'en' }, { name: 'Japanese', code: 'ja' }, { name: 'French', code: 'fr' }]) {
    const id = uuid();
    langIds.push(id);
    await db.insert(schema.languages).values({ id, name: lang.name, code: lang.code }).onConflictDoNothing();
  }

  // Ports
  const portIds: string[] = [];
  for (const p of PORTS) {
    const id = uuid();
    portIds.push(id);
    await db.insert(schema.ports).values({ id, name: p.name, code: p.code }).onConflictDoNothing();
  }

  // Currencies
  const currencyIds: string[] = [];
  for (const c of CURRENCIES) {
    const id = uuid();
    currencyIds.push(id);
    await db.insert(schema.currencies).values({ id, code: c.code, name: c.name }).onConflictDoNothing();
  }

  // Body types
  const bodyTypeIds: string[] = [];
  for (const name of BODY_TYPES) {
    const id = uuid();
    bodyTypeIds.push(id);
    await db.insert(schema.bodyTypes).values({ id, name }).onConflictDoNothing();
  }

  // Fuel types
  const fuelTypeIds: string[] = [];
  for (const name of FUEL_TYPES) {
    const id = uuid();
    fuelTypeIds.push(id);
    await db.insert(schema.fuelTypes).values({ id, name }).onConflictDoNothing();
  }

  // Transmissions
  const transmissionIds: string[] = [];
  for (const name of TRANSMISSIONS) {
    const id = uuid();
    transmissionIds.push(id);
    await db.insert(schema.transmissions).values({ id, name }).onConflictDoNothing();
  }

  // Drive types
  const driveTypeIds: string[] = [];
  for (const name of DRIVE_TYPES) {
    const id = uuid();
    driveTypeIds.push(id);
    await db.insert(schema.driveTypes).values({ id, name }).onConflictDoNothing();
  }

  // Colors
  const colorIds: string[] = [];
  for (const name of COLORS) {
    const id = uuid();
    colorIds.push(id);
    await db.insert(schema.colors).values({ id, name }).onConflictDoNothing();
  }

  // Manufacturers + Models
  const manufacturerIds: string[] = [];
  const allModelIds: string[] = [];
  for (const m of MANUFACTURERS) {
    const mId = uuid();
    manufacturerIds.push(mId);
    await db.insert(schema.manufacturers).values({
      id: mId,
      name: m.name,
      slug: m.slug,
      countryId: countryIds[0], // Japan
    }).onConflictDoNothing();
    for (const modelName of MODELS[m.slug]) {
      const modelId = uuid();
      allModelIds.push(modelId);
      await db.insert(schema.models).values({
        id: modelId,
        manufacturerId: mId,
        name: modelName,
        slug: generateSlug(`${m.slug}-${modelName}`),
      }).onConflictDoNothing();
    }
  }

  console.log('✅ Reference data seeded');
  return { countryIds, langIds, portIds, currencyIds, bodyTypeIds, fuelTypeIds, transmissionIds, driveTypeIds, colorIds, manufacturerIds, allModelIds };
}

async function seedRoles() {
  console.log('👤 Seeding roles...');
  const roleIds: Record<string, string> = {};

  for (const role of ['super_admin', 'admin', 'dealer', 'customer'] as const) {
    const id = uuid();
    roleIds[role] = id;
    await db.insert(schema.roles).values({
      id,
      name: role.replace('_', ' '),
      slug: role,
    }).onConflictDoNothing();
  }

  // Permissions
  const permissionSlugs = [
    'vehicles.create', 'vehicles.read', 'vehicles.update', 'vehicles.delete',
    'orders.create', 'orders.read', 'orders.update', 'orders.delete',
    'customers.read', 'customers.update',
    'dealers.read', 'dealers.update',
    'payments.read', 'payments.create',
    'settings.read', 'settings.update',
    'analytics.read',
    'cms.read', 'cms.create', 'cms.update', 'cms.delete', 'cms.publish', 'cms.manage',
  ];
  const permissionIds: string[] = [];
  for (const slug of permissionSlugs) {
    const id = uuid();
    permissionIds.push(id);
    await db.insert(schema.permissions).values({
      id,
      name: slug.replace('.', ' '),
      slug,
    }).onConflictDoNothing();
  }

  // Assign all permissions to super_admin
  for (const pId of permissionIds) {
    await db.insert(schema.rolePermissions).values({
      roleId: roleIds.super_admin,
      permissionId: pId,
    }).onConflictDoNothing();
  }

  console.log('✅ Roles seeded');
  return roleIds;
}

async function seedUsers(roleIds: Record<string, string>, countryIds: string[]) {
  console.log('👥 Seeding users...');
  const customerIds: string[] = [];
  const customerUserIds: string[] = [];
  const dealerIds: string[] = [];

  resetUsedEmails();

  // Super admin
  const superAdminUserId = uuid();
  await db.insert(schema.users).values({
    id: superAdminUserId,
    email: 'admin@zafautos.com',
    role: 'super_admin',
    status: 'active',
    roleId: roleIds.super_admin,
  }).onConflictDoNothing();
  await db.insert(schema.profiles).values({
    userId: superAdminUserId,
    firstName: 'Admin',
    lastName: 'ZafAutos',
  }).onConflictDoNothing();

  // Admins
  for (let i = 0; i < 3; i++) {
    const id = uuid();
    await db.insert(schema.users).values({
      id,
      email: `admin${i + 1}@zafautos.com`,
      role: 'admin',
      status: 'active',
      roleId: roleIds.admin,
    }).onConflictDoNothing();
    await db.insert(schema.profiles).values({
      userId: id,
      firstName: `Admin${i + 1}`,
      lastName: 'Staff',
    }).onConflictDoNothing();
  }

  // Dealers
  for (let i = 0; i < 5; i++) {
    const userId = uuid();
    const dealerId = uuid();
    const firstName = randomItem(FIRST_NAMES);
    const lastName = randomItem(LAST_NAMES);
    await db.insert(schema.users).values({
      id: userId,
      email: generateEmail(firstName, lastName),
      role: 'dealer',
      status: 'active',
      roleId: roleIds.dealer,
    }).onConflictDoNothing();
    await db.insert(schema.profiles).values({
      userId,
      firstName,
      lastName,
      phone: generatePhone(),
    }).onConflictDoNothing();
    await db.insert(schema.dealers).values({ id: dealerId, userId }).onConflictDoNothing();
    await db.insert(schema.dealerProfiles).values({
      dealerId,
      displayName: `${firstName} ${lastName} Auto Sales`,
    }).onConflictDoNothing();
    dealerIds.push(dealerId);
  }

  // Customers
  for (let i = 0; i < 20; i++) {
    const userId = uuid();
    const customerId = uuid();
    const firstName = randomItem(FIRST_NAMES);
    const lastName = randomItem(LAST_NAMES);
    await db.insert(schema.users).values({
      id: userId,
      email: generateEmail(firstName, lastName),
      role: 'customer',
      status: 'active',
      roleId: roleIds.customer,
    }).onConflictDoNothing();
    await db.insert(schema.profiles).values({
      userId,
      firstName,
      lastName,
      phone: generatePhone(),
      countryId: randomItem(countryIds),
    }).onConflictDoNothing();
    await db.insert(schema.customers).values({ id: customerId, userId }).onConflictDoNothing();
    await db.insert(schema.customerProfiles).values({
      customerId,
      displayName: `${firstName} ${lastName}`,
    }).onConflictDoNothing();
    customerIds.push(customerId);
    customerUserIds.push(userId);
  }

  console.log('✅ Users seeded');
  return { customerIds, dealerIds, customerUserIds };
}

async function seedVehicles(refs: ReturnType<typeof seedReferenceData> extends Promise<infer R> ? R : never) {
  console.log('🚗 Seeding vehicles...');
  const vehicleIds: string[] = [];
  const usedSlugs = new Set<string>();
  resetUsedVins();

  const statuses: Array<'active' | 'draft' | 'sold' | 'archived'> = [
    ...Array(30).fill('active'),
    ...Array(10).fill('draft'),
    ...Array(5).fill('sold'),
    ...Array(5).fill('archived'),
  ];

  for (let i = 0; i < 50; i++) {
    const vehicleId = uuid();
    vehicleIds.push(vehicleId);
    const mfgIdx = randomIntRange(0, refs.manufacturerIds.length - 1);
    const modelIdx = randomIntRange(0, refs.allModelIds.length - 1);
    const year = randomIntRange(2015, 2024);
    const makeName = MANUFACTURERS[mfgIdx]?.name ?? 'Toyota';
    const modelName = Object.values(MODELS).flat()[modelIdx] ?? 'Corolla';

    let slug = generateSlug(`${year}-${makeName}-${modelName}-${i + 1}`);
    let slugAttempt = 0;
    while (usedSlugs.has(slug)) {
      slugAttempt++;
      slug = generateSlug(`${year}-${makeName}-${modelName}-${i + 1}-${slugAttempt}`);
    }
    usedSlugs.add(slug);

    await db.insert(schema.vehicles).values({
      id: vehicleId,
      vin: generateVin(),
      stockNumber: generateStockNumber(i + 1),
      manufacturerId: refs.manufacturerIds[mfgIdx],
      modelId: refs.allModelIds[modelIdx],
      bodyTypeId: randomItem(refs.bodyTypeIds),
      fuelTypeId: randomItem(refs.fuelTypeIds),
      transmissionId: randomItem(refs.transmissionIds),
      driveTypeId: randomItem(refs.driveTypeIds),
      colorId: randomItem(refs.colorIds),
      year,
      engineCc: randomItem([660, 1000, 1300, 1500, 1800, 2000, 2400, 2500, 3000, 3500]),
      horsepower: randomIntRange(60, 350),
      mileage: randomIntRange(10000, 200000),
      doors: randomItem([3, 4, 5]),
      seats: randomItem([2, 4, 5, 7, 8]),
      price: randomIntRange(2000, 45000),
      currencyId: refs.currencyIds[0],
      auctionGrade: randomItem(AUCTION_GRADES),
      condition: randomItem(CONDITIONS),
      countryId: refs.countryIds[0],
      portId: randomItem(refs.portIds),
      status: statuses[i] ?? 'active',
      slug,
      isFeatured: i < 8,
    }).onConflictDoNothing();

    // Images (3-5 per vehicle)
    const imageCount = randomIntRange(3, 5);
    for (let j = 0; j < imageCount; j++) {
      await db.insert(schema.vehicleImages).values({
        vehicleId,
        imageUrl: `https://placehold.co/800x600/1A1A1A/E8E8E8?text=${encodeURIComponent(`${makeName} ${modelName}`)}+${j + 1}`,
        sortOrder: j,
        isPrimary: j === 0,
      }).onConflictDoNothing();
    }

    // Features (5-10 per vehicle)
    const featurePool = ['ABS', 'Air Conditioning', 'Power Steering', 'Power Windows', 'Central Locking', 'Airbags', 'Navigation System', 'Bluetooth', 'Backup Camera', 'Cruise Control', 'Keyless Entry', 'Heated Seats', 'Sunroof', 'Alloy Wheels', 'Fog Lights'];
    const featureCount = randomIntRange(5, 10);
    const shuffledFeatures = featurePool.sort(() => Math.random() - 0.5).slice(0, featureCount);
    for (const feature of shuffledFeatures) {
      await db.insert(schema.vehicleFeatures).values({ vehicleId, name: feature }).onConflictDoNothing();
    }

    // Specifications (3-5 per vehicle)
    const specPool = [
      { name: 'Engine Type', value: randomItem(['V6', 'Inline-4', 'Inline-3', 'Boxer', 'Rotary', 'Electric Motor']) },
      { name: 'Fuel Economy', value: `${randomIntRange(5, 25)} km/L` },
      { name: 'Weight', value: `${randomIntRange(800, 2500)} kg` },
      { name: 'Length', value: `${randomIntRange(3500, 5200)} mm` },
      { name: 'Width', value: `${randomIntRange(1600, 2100)} mm` },
      { name: 'Wheelbase', value: `${randomIntRange(2300, 3200)} mm` },
      { name: 'Cargo Volume', value: `${randomIntRange(200, 2000)} L` },
    ];
    const specCount = randomIntRange(3, 5);
    const shuffledSpecs = specPool.sort(() => Math.random() - 0.5).slice(0, specCount);
    for (const spec of shuffledSpecs) {
      await db.insert(schema.vehicleSpecifications).values({
        vehicleId,
        name: spec.name,
        value: spec.value,
      }).onConflictDoNothing();
    }
  }

  console.log(`✅ ${vehicleIds.length} vehicles seeded`);
  return vehicleIds;
}

async function seedOrdersPaymentsShipments(customerIds: string[], customerUserIds: string[], dealerIds: string[], vehicleIds: string[]) {
  console.log('📦 Seeding orders, payments, shipments...');

  const orderStatuses: Array<'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'> = [
    ...Array(3).fill('pending'),
    ...Array(2).fill('confirmed'),
    ...Array(3).fill('processing'),
    ...Array(4).fill('shipped'),
    ...Array(2).fill('delivered'),
    ...Array(1).fill('cancelled'),
  ];

  for (let i = 0; i < 15; i++) {
    const orderId = uuid();
    const status = orderStatuses[i] ?? 'pending';
    const customerId = randomItem(customerIds);
    const dealerId = randomItem(dealerIds);
    const vehicleId = randomItem(vehicleIds);

    await db.insert(schema.orders).values({
      id: orderId,
      orderNumber: `ORD-${new Date().getFullYear()}-${String(i + 1).padStart(4, '0')}`,
      customerId,
      dealerId,
      vehicleId,
      status,
      totalAmount: randomIntRange(5000, 50000),
    }).onConflictDoNothing();

    // Order item
    await db.insert(schema.orderItems).values({
      orderId,
      vehicleId,
      quantity: 1,
      price: randomIntRange(5000, 50000),
    }).onConflictDoNothing();

    // Payment
    const paymentStatus = status === 'cancelled' ? 'refunded' : status === 'delivered' ? 'paid' : randomItem(['pending', 'paid']);
    const paymentId = uuid();
    const customerIdx = customerIds.indexOf(customerId);
    await db.insert(schema.payments).values({
      id: paymentId,
      orderId,
      userId: customerIdx >= 0 ? customerUserIds[customerIdx] : undefined,
      amount: randomIntRange(5000, 50000),
      currency: 'USD',
      status: paymentStatus as 'pending' | 'paid' | 'failed' | 'refunded',
    }).onConflictDoNothing();

    // Payment history
    await db.insert(schema.paymentHistory).values({
      paymentId,
      status: paymentStatus as 'pending' | 'paid' | 'failed' | 'refunded',
      note: `Payment ${paymentStatus}`,
    }).onConflictDoNothing();

    // Shipment (for shipped/delivered)
    if (status === 'shipped' || status === 'delivered') {
      const shipmentId = uuid();
      await db.insert(schema.shipments).values({
        id: shipmentId,
        orderId,
        status: status === 'delivered' ? 'delivered' : 'in_transit',
        carrier: randomItem(['NYK Line', 'MOL', 'K-Line', 'SITC']),
      }).onConflictDoNothing();

      await db.insert(schema.shipmentTracking).values({
        shipmentId,
        location: randomItem(['Tokyo Port', 'Mombasa Port', 'Dar es Salaam Port', 'In Transit']),
        note: status === 'delivered' ? 'Delivered to destination' : 'In transit',
      }).onConflictDoNothing();
    }

    // Order status history
    await db.insert(schema.orderStatus).values({
      orderId,
      status,
      note: `Order ${status}`,
    }).onConflictDoNothing();
  }

  console.log('✅ Orders, payments, shipments seeded');
}

async function seedMessagesNotifications(vehicleIds: string[], customerIds: string[], customerUserIds: string[]) {
  console.log('💬 Seeding messages, notifications...');

  // Create threads and messages
  for (let i = 0; i < 10; i++) {
    const threadId = uuid();
    await db.insert(schema.messageThreads).values({
      id: threadId,
      subject: randomItem(['Vehicle Enquiry', 'Shipping Question', 'Payment Issue', 'General Question', 'Vehicle Availability']),
    }).onConflictDoNothing();

    const msgCount = randomIntRange(2, 5);
    for (let j = 0; j < msgCount; j++) {
      await db.insert(schema.messages).values({
        threadId,
        content: randomItem([
          'Is this vehicle still available?',
          'What is the total shipping cost?',
          'Can you provide more photos?',
          'When is the next shipment?',
          'What payment methods do you accept?',
          'Thank you for the information.',
          'I would like to proceed with the purchase.',
          'Could you provide a mechanical inspection report?',
        ]),
        isRead: j < msgCount - 1,
      }).onConflictDoNothing();
    }
  }

  // Notifications
  for (let i = 0; i < 20; i++) {
    await db.insert(schema.notifications).values({
      userId: randomItem(customerUserIds),
      title: randomItem(['New enquiry', 'Order update', 'Payment received', 'Vehicle sold', 'Shipment update']),
      body: randomItem([
        'You have a new enquiry for a vehicle.',
        'Your order status has been updated.',
        'Payment has been received.',
        'A vehicle has been marked as sold.',
        'Shipment tracking has been updated.',
      ]),
      status: randomItem(['unread', 'read', 'archived']),
    }).onConflictDoNothing();
  }

  // Analytics
  for (let i = 0; i < 100; i++) {
    await db.insert(schema.analyticsEvents).values({
      eventName: randomItem(['page_view', 'vehicle_view', 'search', 'enquiry', 'add_to_wishlist', 'compare']),
    }).onConflictDoNothing();
  }

  // Page views
  for (let i = 0; i < 200; i++) {
    await db.insert(schema.pageViews).values({
      path: randomItem(['/', '/vehicles', '/compare', '/wishlist', '/contact', '/vehicles/toyota-corolla']),
    }).onConflictDoNothing();
  }

  console.log('✅ Messages, notifications, analytics seeded');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Starting seed...\n');

  try {
    await clearDatabase();
    const refs = await seedReferenceData();
    const roleIds = await seedRoles();
    const { customerIds, dealerIds, customerUserIds } = await seedUsers(roleIds, refs.countryIds);
    const vehicleIds = await seedVehicles(refs);
    await seedOrdersPaymentsShipments(customerIds, customerUserIds, dealerIds, vehicleIds);
    await seedMessagesNotifications(vehicleIds, customerIds, customerUserIds);

    console.log('\n🎉 Seed completed successfully!');
    console.log('──────────────────────────────');
    console.log('  50 vehicles');
    console.log('  25 users (1 super_admin, 3 admin, 5 dealer, 20 customer)');
    console.log('  15 orders with payments & shipments');
    console.log('  10 message threads');
    console.log('  100 analytics events');
    console.log('  200 page views');
    console.log('──────────────────────────────');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
