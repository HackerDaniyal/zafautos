import postgres from 'postgres';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { validateEnv } from '@/lib/env';

const env = validateEnv();

const sql = postgres(env.DATABASE_URL, {
  max: 10,
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
});

export const db: PostgresJsDatabase = drizzle(sql);
