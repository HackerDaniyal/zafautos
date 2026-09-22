-- Phase 5A: Storage & Document Security Remediation
-- Fix anonymous access to vehicle_documents
-- Fix customer access to order_documents and shipping_documents
-- Add Storage-level policies for documents bucket

-- ─── Fix vehicle_documents anonymous SELECT ─────────────────

-- Remove the anonymous SELECT policy that exposed private vehicle documents
DROP POLICY IF EXISTS "vehicle_documents_select_anon" ON public.vehicle_documents;

-- Create authenticated-only SELECT policy for vehicle_documents
-- Only the document creator, vehicle owner, or admin can access documents
CREATE POLICY "vehicle_documents_select_auth" ON public.vehicle_documents
  FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR is_admin()
    OR vehicleId IN (
      SELECT id FROM public.vehicles WHERE created_by = auth.uid()
    )
  );

-- ─── Fix order_documents customer access ──────────────

-- Remove the admin-only policy that blocked customers from their own order documents
DROP POLICY IF EXISTS "order_documents_select_auth" ON public.order_documents;

-- Allow customers to access documents for their own orders
-- Chain: order_documents.orderId → orders.id → orders.customerId → customers.userId = auth.uid()
CREATE POLICY "order_documents_select_auth" ON public.order_documents
  FOR SELECT TO authenticated
  USING (
    is_admin()
    OR orderId IN (
      SELECT o.id FROM public.orders o
      JOIN public.customers c ON c.id = o.customerId
      WHERE c.user_id = auth.uid() AND c.deleted_at IS NULL AND o.deleted_at IS NULL
    )
    OR is_dealer_assigned_to_order(orderId)
  );

-- ─── Fix shipping_documents customer access ──────────────

-- Remove the admin-only policy that blocked customers from their own shipping documents
DROP POLICY IF EXISTS "shipping_documents_select_auth" ON public.shipping_documents;

-- Allow customers to access shipping documents for their own orders
-- Chain: shipping_documents.shipmentId → shipments.id → shipments.orderId → orders.customerId → customers.userId = auth.uid()
CREATE POLICY "shipping_documents_select_auth" ON public.shipping_documents
  FOR SELECT TO authenticated
  USING (
    is_admin()
    OR shipmentId IN (
      SELECT s.id FROM public.shipments s
      JOIN public.orders o ON o.id = s.orderId
      JOIN public.customers c ON c.id = o.customerId
      WHERE c.user_id = auth.uid() AND c.deleted_at IS NULL AND o.deleted_at IS NULL AND s.deleted_at IS NULL
    )
  );

-- ─── Storage-level policies for documents bucket ──────────

-- Storage RLS policies are defense-in-depth for the documents bucket.
-- Service-role operations bypass Storage RLS, so these policies must not
-- replace server-side authorization.

-- Ensure storage.objects has RLS enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Deny anonymous access to documents bucket objects
CREATE POLICY "documents_deny_anon" ON storage.objects
  FOR ALL TO anon
  USING (false)
  WITH CHECK (false);
