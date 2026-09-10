/**
 * Super Admin Bootstrap Script
 *
 * Creates the first Super Admin user in both Supabase Auth and the database.
 * Can only be run if no super_admin exists yet.
 *
 * Usage:
 *   npx tsx src/server/db/seeds/bootstrap-admin.ts
 *
 * Environment variables required:
 *   DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { createClient } from '@supabase/supabase-js';
import * as schema from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import * as readline from 'readline';

const DATABASE_URL = process.env.DATABASE_URL;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!DATABASE_URL || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables:');
  console.error('  DATABASE_URL');
  console.error('  NEXT_PUBLIC_SUPABASE_URL');
  console.error('  SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { max: 5 });
const db = drizzle(sql, { schema });

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function ask(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log('\n🔧 ZafAutos Japan — Super Admin Bootstrap\n');

  // Check if super_admin already exists
  const [existing] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.role, 'super_admin'))
    .limit(1);

  if (existing) {
    console.log('❌ A Super Admin already exists:');
    console.log(`   Email: ${existing.email}`);
    console.log(`   ID: ${existing.id}`);
    console.log('\nBootstrap is only for creating the FIRST Super Admin.');
    console.log('Use the admin panel to create additional admins.\n');
    await sql.end();
    process.exit(0);
  }

  // Collect details
  const email = await ask('Email: ');
  if (!email || !email.includes('@')) {
    console.error('Invalid email address.');
    await sql.end();
    process.exit(1);
  }

  const firstName = await ask('First Name: ');
  if (!firstName) {
    console.error('First name is required.');
    await sql.end();
    process.exit(1);
  }

  const lastName = await ask('Last Name: ');
  if (!lastName) {
    console.error('Last name is required.');
    await sql.end();
    process.exit(1);
  }

  const password = await ask('Password (min 8 chars): ');
  if (!password || password.length < 8) {
    console.error('Password must be at least 8 characters.');
    await sql.end();
    process.exit(1);
  }

  console.log('\n⏳ Creating Super Admin...\n');

  // Step 1: Create Supabase Auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: firstName,
      last_name: lastName,
    },
  });

  if (authError) {
    console.error('❌ Failed to create Supabase Auth user:', authError.message);
    await sql.end();
    process.exit(1);
  }

  if (!authData.user) {
    console.error('❌ No user returned from Supabase Auth.');
    await sql.end();
    process.exit(1);
  }

  console.log('✅ Supabase Auth user created:', authData.user.id);

  // Step 2: Get super_admin role
  const [superAdminRole] = await db
    .select()
    .from(schema.roles)
    .where(eq(schema.roles.slug, 'super_admin'))
    .limit(1);

  // Step 3: Create database rows in transaction
  try {
    await db.transaction(async (tx) => {
      await tx.insert(schema.users).values({
        id: authData.user!.id,
        email,
        role: 'super_admin',
        status: 'active',
        roleId: superAdminRole?.id ?? null,
      });

      await tx.insert(schema.profiles).values({
        userId: authData.user!.id,
        firstName,
        lastName,
      });
    });

    console.log('✅ Database rows created (users + profiles)');
  } catch (dbError) {
    console.error('❌ Failed to create database rows:', dbError);
    // Compensating rollback
    await supabase.auth.admin.deleteUser(authData.user.id);
    console.log('↩️  Supabase Auth user deleted (rollback)');
    await sql.end();
    process.exit(1);
  }

  console.log('\n🎉 Super Admin created successfully!\n');
  console.log(`   Email:    ${email}`);
  console.log(`   Name:     ${firstName} ${lastName}`);
  console.log(`   Role:     super_admin`);
  console.log(`   Auth ID:  ${authData.user.id}`);
  console.log('\nYou can now sign in at /login\n');

  await sql.end();
}

main().catch(async (error) => {
  console.error('Unexpected error:', error);
  await sql.end();
  process.exit(1);
});
