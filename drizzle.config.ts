import { config } from 'dotenv';
config({ path: '.env.local' });
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/server/db/schema/*',
  out: './src/server/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
