import { createClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client authenticated with the service-role key.
 *
 * This client bypasses Row Level Security (RLS) and is intended
 * exclusively for server-side storage operations where the application
 * layer (server actions / services) handles its own RBAC via
 * requireAuth() + requirePermission().
 *
 * SECURITY RULES:
 *   - Server-only module (never import from Client Components)
 *   - Key is NEVER exposed via NEXT_PUBLIC_*
 *   - Session persistence/refresh disabled (stateless)
 *   - Must NOT be used to bypass ZafAutos authorization
 */
export function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase service-role configuration. ' +
        'Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local',
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
