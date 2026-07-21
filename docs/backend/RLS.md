# RLS Policy Summary

## Migration File

`src/server/db/migrations/0001_rls_policies.sql`

## Helper Functions

| Function | Purpose |
|----------|---------|
| `is_admin()` | Checks if auth.uid() has admin/super_admin role |
| `is_dealer()` | Checks if auth.uid() has dealer role |
| `is_customer()` | Checks if auth.uid() has customer role |
| `get_customer_id_from_user(uid)` | Maps auth.uid() to customer.id |
| `is_dealer_assigned_to_order(order_id)` | Checks dealer↔order assignment |

## Access Matrix

| Table | anon | authenticated | dealer | admin |
|-------|------|---------------|--------|-------|
| vehicles (active) | SELECT | SELECT | SELECT | ALL |
| vehicles (all) | — | — | SELECT (assigned) | ALL |
| manufacturers, models, etc. | SELECT | SELECT | SELECT | ALL |
| body_types, fuel_types, etc. | SELECT | SELECT | SELECT | ALL |
| countries, ports, currencies | SELECT | SELECT | SELECT | ALL |
| users | — | SELECT (own) | — | ALL |
| profiles | — | SELECT/UPDATE (own) | — | ALL |
| customers | — | SELECT (own) | — | ALL |
| dealers | — | — | SELECT (own) | ALL |
| orders | — | SELECT (own) | SELECT (assigned) | ALL |
| payments | — | SELECT (own) | — | ALL |
| shipments | — | SELECT (own order) | SELECT (assigned) | ALL |
| messages | — | SELECT (sender/recipient) | — | ALL |
| notifications | — | SELECT (own) | — | ALL |
| vehicle_wishlist | — | SELECT/INSERT/DELETE (own) | — | ALL |
| vehicle_compare | — | SELECT/INSERT/DELETE (own) | — | ALL |
| vehicle_enquiries | — | INSERT (own) | — | ALL |
| site_settings | SELECT | SELECT | SELECT | ALL |
| analytics_events | — | INSERT | — | ALL |
| page_views | — | INSERT | — | ALL |

## Policy Naming Convention

`{table}_{action}_{role}`

Examples:
- `vehicles_select_anon` — anon can SELECT active vehicles
- `vehicles_insert_admin` — admin can INSERT vehicles
- `customer_wishlist_select_authenticated` — authenticated can SELECT own wishlist
