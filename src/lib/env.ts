import { z } from 'zod';

/**
 * Schema for server-only environment variables.
 * These are never exposed to the browser.
 */
const serverEnvSchema = z.object({
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

/**
 * Schema for public environment variables.
 * These are prefixed with NEXT_PUBLIC_ and are available in the browser.
 */
const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url('NEXT_PUBLIC_APP_URL must be a valid URL'),
  NEXT_PUBLIC_APP_NAME: z.string().min(1, 'NEXT_PUBLIC_APP_NAME is required'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
});

/**
 * Combined schema for all environment variables.
 */
const envSchema = serverEnvSchema.merge(publicEnvSchema);

export type Env = z.infer<typeof envSchema>;
export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Validates and returns all environment variables.
 * Call this at application startup to fail fast on misconfiguration.
 *
 * @throws {ZodError} if any required environment variable is missing or invalid.
 */
export function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error(
      '❌ Invalid environment variables:',
      parsed.error.flatten().fieldErrors,
    );
    throw new Error('Invalid environment variables');
  }

  return parsed.data;
}

/**
 * Validates and returns only public environment variables.
 * Safe to call from client-side code.
 */
export function getPublicEnv(): PublicEnv {
  const parsed = publicEnvSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  if (!parsed.success) {
    console.error(
      '❌ Invalid public environment variables:',
      parsed.error.flatten().fieldErrors,
    );
    throw new Error('Invalid public environment variables');
  }

  return parsed.data;
}
