const postgres = require('postgres');
const connStr = 'postgresql://postgres.REMOVED_PROJECT_REF:REMOVED_DB_PASS@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';
const client = postgres(connStr, { max: 1, ssl: 'require' });

async function run() {
  // Step 1: Create enum
  try {
    await client.unsafe("CREATE TYPE notification_category_enum AS ENUM ('order', 'payment', 'shipping', 'support', 'lead', 'vehicle', 'system')");
    console.log('OK: Created notification_category_enum');
  } catch (e) {
    console.log('SKIP enum: ' + e.message.substring(0, 80));
  }

  // Step 2: Add columns to notifications
  const cols = [
    'ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type VARCHAR(100)',
    'ALTER TABLE notifications ADD COLUMN IF NOT EXISTS category notification_category_enum',
    'ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link TEXT',
    'ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata JSONB',
    'ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ',
    'ALTER TABLE notifications ADD COLUMN IF NOT EXISTS event_key VARCHAR(255)',
  ];
  for (const stmt of cols) {
    try {
      await client.unsafe(stmt);
      console.log('OK: ' + stmt.substring(0, 70));
    } catch (e) {
      console.log('SKIP: ' + stmt.substring(0, 50) + ' | ' + e.message.substring(0, 60));
    }
  }

  // Step 3: Backfill
  try {
    await client.unsafe("UPDATE notifications SET type = 'system.message', category = 'system' WHERE type IS NULL");
    console.log('OK: Backfilled type and category');
  } catch (e) {
    console.log('SKIP backfill: ' + e.message.substring(0, 80));
  }

  // Step 4: NOT NULL
  try {
    await client.unsafe('ALTER TABLE notifications ALTER COLUMN type SET NOT NULL');
    console.log('OK: type NOT NULL');
  } catch (e) {
    console.log('SKIP type NOT NULL: ' + e.message.substring(0, 60));
  }
  try {
    await client.unsafe('ALTER TABLE notifications ALTER COLUMN category SET NOT NULL');
    console.log('OK: category NOT NULL');
  } catch (e) {
    console.log('SKIP category NOT NULL: ' + e.message.substring(0, 60));
  }

  // Step 5: Indexes
  const indexes = [
    'CREATE INDEX IF NOT EXISTS notifications_type_idx ON notifications(type)',
    'CREATE INDEX IF NOT EXISTS notifications_category_idx ON notifications(category)',
    'CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at)',
  ];
  for (const idx of indexes) {
    try {
      await client.unsafe(idx);
      console.log('OK: ' + idx.substring(0, 60));
    } catch (e) {
      console.log('SKIP: ' + idx.substring(0, 40) + ' | ' + e.message.substring(0, 60));
    }
  }

  // Unique index for dedup
  try {
    await client.unsafe('CREATE UNIQUE INDEX IF NOT EXISTS notifications_event_key_unique_idx ON notifications(event_key) WHERE event_key IS NOT NULL');
    console.log('OK: event_key unique index');
  } catch (e) {
    console.log('SKIP event_key unique: ' + e.message.substring(0, 80));
  }

  // Step 6: notification_preferences table
  try {
    await client.unsafe(`
      CREATE TABLE IF NOT EXISTS notification_preferences (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category notification_category_enum NOT NULL,
        in_app_enabled BOOLEAN NOT NULL DEFAULT true,
        email_enabled BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE(user_id, category)
      )
    `);
    console.log('OK: Created notification_preferences table');
  } catch (e) {
    console.log('SKIP notification_preferences: ' + e.message.substring(0, 80));
  }
  try {
    await client.unsafe('CREATE INDEX IF NOT EXISTS notification_preferences_user_idx ON notification_preferences(user_id)');
    console.log('OK: notification_preferences index');
  } catch (e) {
    console.log('SKIP pref idx: ' + e.message.substring(0, 60));
  }

  // Step 7: Add category to notification_rules
  try {
    await client.unsafe('ALTER TABLE notification_rules ADD COLUMN IF NOT EXISTS category notification_category_enum');
    console.log('OK: Added category to notification_rules');
  } catch (e) {
    console.log('SKIP rules category: ' + e.message.substring(0, 80));
  }
  try {
    await client.unsafe("UPDATE notification_rules SET category = 'order' WHERE event_type LIKE 'order.%' AND category IS NULL");
    await client.unsafe("UPDATE notification_rules SET category = 'payment' WHERE event_type LIKE 'payment.%' AND category IS NULL");
    await client.unsafe("UPDATE notification_rules SET category = 'shipping' WHERE event_type LIKE 'shipping.%' AND category IS NULL");
    await client.unsafe("UPDATE notification_rules SET category = 'lead' WHERE event_type LIKE 'enquiry.%' AND category IS NULL");
    await client.unsafe("UPDATE notification_rules SET category = 'system' WHERE event_type LIKE 'user.%' AND category IS NULL");
    console.log('OK: Backfilled notification_rules categories');
  } catch (e) {
    console.log('SKIP rules backfill: ' + e.message.substring(0, 80));
  }

  // Verify
  const notifCount = await client.unsafe('SELECT count(*)::int as count FROM notifications');
  const prefCount = await client.unsafe('SELECT count(*)::int as count FROM notification_preferences');
  const rulesCount = await client.unsafe('SELECT count(*)::int as count FROM notification_rules');
  console.log('\nVerification:');
  console.log('  notifications: ' + notifCount[0].count + ' rows');
  console.log('  notification_preferences: ' + prefCount[0].count + ' rows');
  console.log('  notification_rules: ' + rulesCount[0].count + ' rows');

  const cols2 = await client.unsafe("SELECT column_name FROM information_schema.columns WHERE table_name = 'notifications' ORDER BY ordinal_position");
  console.log('  notifications columns: ' + cols2.map(r => r.column_name).join(', '));

  const prefCols = await client.unsafe("SELECT column_name FROM information_schema.columns WHERE table_name = 'notification_preferences' ORDER BY ordinal_position");
  console.log('  notification_preferences columns: ' + prefCols.map(r => r.column_name).join(', '));

  await client.end();
  console.log('\nMigration complete.');
}
run().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
