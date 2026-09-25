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
    max: 1,
    prepare: false,
    ssl: 'require',
  });
  globalForPostgres.__db = drizzle(globalForPostgres.__postgresClient);
}

export const db: PostgresJsDatabase = globalForPostgres.__db!;
