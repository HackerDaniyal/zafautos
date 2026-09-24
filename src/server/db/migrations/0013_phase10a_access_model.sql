-- Phase 10A Remediation: Access model + rate_limits (C1/C2)
--
-- Access model (explicit):
--   * Public/anon and authenticated PostgREST roles get NO direct table access.
--     Public site data is served by the Next.js server (Drizzle via DATABASE_URL
--     as owner `postgres`) or by service-role server actions — never by exposing
--     PostgREST table reads to the browser.
--   * service_role: server-side only (bypasses RLS; used for auth admin + storage).
--   * Table owner (postgres / DATABASE_URL): full access for application queries.
--   * storage.objects: public bucket URLs remain public; documents bucket denied to anon.
--
-- This migration is idempotent (safe to re-run).

-- ─── C2: rate_limits (never applied on live DB) ──────────────────────────────

CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier VARCHAR(255) NOT NULL,
    route_key VARCHAR(255) NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'rate_limits_identifier_route_window_unique'
          AND conrelid = 'rate_limits'::regclass
    ) THEN
        ALTER TABLE rate_limits
            ADD CONSTRAINT rate_limits_identifier_route_window_unique
            UNIQUE (identifier, route_key, window_start);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS rate_limits_identifier_route_idx
    ON rate_limits (identifier, route_key);

-- Note: 0010's partial index (WHERE expires_at > NOW()) is invalid — index
-- predicates must be IMMUTABLE, and NOW() is not. Cleanup uses the full
-- expires_at index below instead (0012).
CREATE INDEX IF NOT EXISTS rate_limits_expires_at_idx
    ON rate_limits (expires_at);

-- ─── Helper functions (from 0001; needed by any future storage/doc policies) ─

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin') AND deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_dealer()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'dealer' AND deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_customer()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'customer' AND deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_customer_id_from_user(uid uuid)
RETURNS uuid AS $$
BEGIN
  RETURN (SELECT id FROM public.customers WHERE user_id = uid AND deleted_at IS NULL LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_dealer_assigned_to_order(order_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.dealer_assignments da
    JOIN public.dealers d ON d.id = da.dealer_id
    WHERE da.order_id = $1 AND d.user_id = auth.uid() AND da.deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ─── C1: Revoke PostgREST table access from browser API roles ────────────────

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;

-- Future tables created by this project must not be granted to browser roles.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;

-- ─── C1: Enable RLS deny-by-default on every public table ────────────────────
-- No policies => non-owner roles (anon/authenticated) are denied.
-- Owner (postgres) and BYPASSRLS (service_role) unaffected.

DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN
        SELECT c.relname
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relkind = 'r'
          AND NOT c.relrowsecurity
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    END LOOP;
END $$;

-- ─── Storage: documents bucket deny to anon (from 0011, scoped correctly) ────
-- storage.objects is owned by supabase_storage_admin; the migration role may
-- not own it. Best-effort: public-schema revoke/RLS above is the critical fix.

DO $$
BEGIN
    EXECUTE 'ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY';
EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Skipping storage.objects ENABLE RLS (not owner)';
END $$;

DO $$
BEGIN
    EXECUTE 'DROP POLICY IF EXISTS "documents_deny_anon" ON storage.objects';
    EXECUTE $p$
        CREATE POLICY "documents_deny_anon" ON storage.objects
          FOR ALL TO anon
          USING (bucket_id = 'documents')
          WITH CHECK (bucket_id = 'documents')
    $p$;
EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Skipping documents_deny_anon policy (not owner of storage.objects)';
END $$;
