-- A.6 Orders & Sales Management
-- Adds vehicle snapshot to order_items, shipping fields, and payment permissions

-- 1. Add vehicle_snapshot to order_items
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS vehicle_snapshot jsonb;

-- 2. Add shipping fields to shipments
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS vessel varchar(255);
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS booking_reference varchar(100);
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS origin_port_id uuid REFERENCES ports(id) ON DELETE SET NULL;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS destination_port_id uuid REFERENCES ports(id) ON DELETE SET NULL;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS estimated_departure timestamptz;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS estimated_arrival timestamptz;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS actual_departure timestamptz;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS actual_arrival timestamptz;

-- 3. Add indexes for new shipping fields
CREATE INDEX IF NOT EXISTS shipments_vessel_idx ON shipments(vessel);
CREATE INDEX IF NOT EXISTS shipments_booking_idx ON shipments(booking_reference);

-- 4. Add payment update/delete permissions
INSERT INTO permissions (id, name, slug) VALUES
  (gen_random_uuid(), 'payments update', 'payments.update'),
  (gen_random_uuid(), 'payments delete', 'payments.delete')
ON CONFLICT (slug) DO NOTHING;

-- 5. Add shipping permissions
INSERT INTO permissions (id, name, slug) VALUES
  (gen_random_uuid(), 'shipping create', 'shipping.create'),
  (gen_random_uuid(), 'shipping read', 'shipping.read'),
  (gen_random_uuid(), 'shipping update', 'shipping.update'),
  (gen_random_uuid(), 'shipping delete', 'shipping.delete')
ON CONFLICT (slug) DO NOTHING;

-- 6. Assign all new permissions to super_admin role
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT gen_random_uuid(), r.id, p.id
FROM roles r, permissions p
WHERE r.slug = 'super_admin'
  AND p.slug IN ('payments.update', 'payments.delete', 'shipping.create', 'shipping.read', 'shipping.update', 'shipping.delete')
ON CONFLICT DO NOTHING;
