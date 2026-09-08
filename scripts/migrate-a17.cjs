const postgres = require('postgres');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const connStr = process.env.DATABASE_URL;
if (!connStr) { console.error('ERROR: DATABASE_URL not set. Copy .env.example to .env.local and fill in values.'); process.exit(1); }
const client = postgres(connStr, { max: 1, ssl: 'require' });

async function run() {
  // 1. Create blog post status enum
  try {
    await client.unsafe("DO $$ BEGIN CREATE TYPE blog_post_status_enum AS ENUM ('draft', 'published', 'archived'); EXCEPTION WHEN duplicate_object THEN null; END $$");
    console.log('OK: blog_post_status_enum');
  } catch (e) { console.log('SKIP enum: ' + e.message.substring(0, 60)); }

  // 2. Banners table
  try {
    await client.unsafe(`
      CREATE TABLE IF NOT EXISTS banners (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        image_url TEXT,
        mobile_image_url TEXT,
        button_text VARCHAR(100),
        button_link TEXT,
        placement VARCHAR(50) NOT NULL DEFAULT 'homepage',
        start_date TIMESTAMPTZ,
        end_date TIMESTAMPTZ,
        is_active BOOLEAN NOT NULL DEFAULT true,
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
        deleted_at TIMESTAMPTZ,
        deleted_by UUID REFERENCES users(id) ON DELETE SET NULL
      )`);
    console.log('OK: banners table');
  } catch (e) { console.log('SKIP banners: ' + e.message.substring(0, 80)); }

  // 3. Testimonials table
  try {
    await client.unsafe(`
      CREATE TABLE IF NOT EXISTS testimonials (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_name VARCHAR(255) NOT NULL,
        customer_location VARCHAR(255),
        customer_image_url TEXT,
        quote TEXT NOT NULL,
        rating INTEGER DEFAULT 5,
        vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
        video_url TEXT,
        is_published BOOLEAN NOT NULL DEFAULT false,
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
        deleted_at TIMESTAMPTZ,
        deleted_by UUID REFERENCES users(id) ON DELETE SET NULL
      )`);
    console.log('OK: testimonials table');
  } catch (e) { console.log('SKIP testimonials: ' + e.message.substring(0, 80)); }

  // 4. FAQs table
  try {
    await client.unsafe(`
      CREATE TABLE IF NOT EXISTS faqs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        question VARCHAR(500) NOT NULL,
        answer TEXT NOT NULL,
        category VARCHAR(100) DEFAULT 'general',
        display_order INTEGER NOT NULL DEFAULT 0,
        is_published BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
        deleted_at TIMESTAMPTZ,
        deleted_by UUID REFERENCES users(id) ON DELETE SET NULL
      )`);
    console.log('OK: faqs table');
  } catch (e) { console.log('SKIP faqs: ' + e.message.substring(0, 80)); }

  // 5. Blog posts table
  try {
    await client.unsafe(`
      CREATE TABLE IF NOT EXISTS blog_posts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        excerpt TEXT,
        content TEXT,
        featured_image_url TEXT,
        author VARCHAR(255),
        category VARCHAR(100),
        tags TEXT,
        status blog_post_status_enum NOT NULL DEFAULT 'draft',
        published_at TIMESTAMPTZ,
        seo_title VARCHAR(255),
        seo_description TEXT,
        canonical_url TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
        deleted_at TIMESTAMPTZ,
        deleted_by UUID REFERENCES users(id) ON DELETE SET NULL
      )`);
    console.log('OK: blog_posts table');
  } catch (e) { console.log('SKIP blog_posts: ' + e.message.substring(0, 80)); }

  // 6. Media uploads table
  try {
    await client.unsafe(`
      CREATE TABLE IF NOT EXISTS media_uploads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        filename VARCHAR(255) NOT NULL,
        storage_path TEXT NOT NULL,
        mime_type VARCHAR(100),
        file_size INTEGER,
        width INTEGER,
        height INTEGER,
        alt_text VARCHAR(255),
        uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        deleted_at TIMESTAMPTZ,
        deleted_by UUID REFERENCES users(id) ON DELETE SET NULL
      )`);
    console.log('OK: media_uploads table');
  } catch (e) { console.log('SKIP media_uploads: ' + e.message.substring(0, 80)); }

  // 7. Indexes
  const indexes = [
    'CREATE INDEX IF NOT EXISTS banners_placement_idx ON banners(placement)',
    'CREATE INDEX IF NOT EXISTS banners_is_active_idx ON banners(is_active)',
    'CREATE INDEX IF NOT EXISTS banners_display_order_idx ON banners(display_order)',
    'CREATE INDEX IF NOT EXISTS testimonials_is_published_idx ON testimonials(is_published)',
    'CREATE INDEX IF NOT EXISTS testimonials_display_order_idx ON testimonials(display_order)',
    'CREATE INDEX IF NOT EXISTS faqs_category_idx ON faqs(category)',
    'CREATE INDEX IF NOT EXISTS faqs_is_published_idx ON faqs(is_published)',
    'CREATE INDEX IF NOT EXISTS faqs_display_order_idx ON faqs(display_order)',
    'CREATE INDEX IF NOT EXISTS blog_posts_slug_idx ON blog_posts(slug)',
    'CREATE INDEX IF NOT EXISTS blog_posts_status_idx ON blog_posts(status)',
    'CREATE INDEX IF NOT EXISTS blog_posts_category_idx ON blog_posts(category)',
    'CREATE INDEX IF NOT EXISTS blog_posts_published_at_idx ON blog_posts(published_at)',
    'CREATE INDEX IF NOT EXISTS media_uploads_mime_type_idx ON media_uploads(mime_type)',
    'CREATE INDEX IF NOT EXISTS media_uploads_uploaded_by_idx ON media_uploads(uploaded_by)',
  ];
  for (const idx of indexes) {
    try { await client.unsafe(idx); } catch (e) { /* skip */ }
  }
  console.log('OK: indexes created');

  // 8. Add how_it_works to enum
  try {
    await client.unsafe("ALTER TYPE homepage_section_type_enum ADD VALUE IF NOT EXISTS 'how_it_works'");
    console.log('OK: how_it_works added to enum');
  } catch (e) { console.log('SKIP how_it_works: ' + e.message.substring(0, 80)); }

  // Verify
  const tables = ['banners', 'testimonials', 'faqs', 'blog_posts', 'media_uploads'];
  console.log('\nVerification:');
  for (const t of tables) {
    const [check] = await client.unsafe("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = $1) as exists", [t]);
    console.log('  ' + t + ': ' + (check.exists ? 'EXISTS' : 'MISSING'));
  }

  await client.end();
  console.log('\nMigration complete.');
}
run().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
