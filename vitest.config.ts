import { config } from 'dotenv';
import { defineConfig } from 'vitest/config';
import path from 'path';

config({ path: '.env.local' });

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.mts'],
    exclude: ['tests/e2e/**', 'node_modules', '.next'],
    env: {
      NODE_ENV: 'test',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/server/**/*.ts', 'src/lib/**/*.ts'],
      exclude: [
        'src/server/db/schema/**',
        'src/server/db/seeds/**',
        'src/server/db/migrations/**',
        'src/server/db/client.ts',
        '**/*.d.ts',
        '**/*.type.ts',
      ],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
    setupFiles: ['tests/setup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
