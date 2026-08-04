import postgres from 'postgres';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { validateEnv } from '@/lib/env';

const env = validateEnv();

const globalForPostgres = globalThis as unknown as {
  __postgresClient?: ReturnType<typeof postgres>;
  __db?: PostgresJsDatabase;
};

if (!globalForPostgres.__postgresClient) {
  globalForPostgres.__postgresClient = postgres(env.DATABASE_URL, {
    max: 10,
    ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
  });
  globalForPostgres.__db = drizzle(globalForPostgres.__postgresClient);
}

export const db: PostgresJsDatabase = globalForPostgres.__db!;
