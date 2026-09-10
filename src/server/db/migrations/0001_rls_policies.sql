-- ZafAutos Japan — Row Level Security Policies
-- Run AFTER 0000_robust_leper_queen.sql

-- ─── Helper Functions ─────────────────────────────────────────────────────────

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

-- ─── Enable RLS on all tables ─────────────────────────────────────────────────

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealer_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealer_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_specifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manufacturers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transmissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drive_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.containers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_compare ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- ─── VEHICLES ─────────────────────────────────────────────────────────────────

-- Anon: read active vehicles
CREATE POLICY "vehicles_select_anon" ON public.vehicles
  FOR SELECT TO anon
  USING (status = 'active' AND deleted_at IS NULL);

-- Authenticated: read active vehicles + all their own drafts
CREATE POLICY "vehicles_select_auth" ON public.vehicles
  FOR SELECT TO authenticated
  USING (
    (status = 'active' AND deleted_at IS NULL)
    OR created_by = auth.uid()
    OR is_admin()
  );

-- Admin: full access
CREATE POLICY "vehicles_insert_admin" ON public.vehicles FOR INSERT TO authenticated
  WITH CHECK (is_admin());
CREATE POLICY "vehicles_update_admin" ON public.vehicles FOR UPDATE TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "vehicles_delete_admin" ON public.vehicles FOR DELETE TO authenticated
  USING (is_admin());

-- ─── VEHICLE IMAGES ───────────────────────────────────────────────────────────

CREATE POLICY "vehicle_images_select_anon" ON public.vehicle_images
  FOR SELECT TO anon USING (true);
CREATE POLICY "vehicle_images_select_auth" ON public.vehicle_images
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "vehicle_images_insert_admin" ON public.vehicle_images
  FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "vehicle_images_update_admin" ON public.vehicle_images
  FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "vehicle_images_delete_admin" ON public.vehicle_images
  FOR DELETE TO authenticated USING (is_admin());

-- ─── VEHICLE VIDEOS / DOCS / FEATURES / SPECS / STATUS ───────────────────────

CREATE POLICY "vehicle_videos_select_anon" ON public.vehicle_videos FOR SELECT TO anon USING (true);
CREATE POLICY "vehicle_videos_all_admin" ON public.vehicle_videos FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "vehicle_documents_select_anon" ON public.vehicle_documents FOR SELECT TO anon USING (true);
CREATE POLICY "vehicle_documents_all_admin" ON public.vehicle_documents FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "vehicle_features_select_anon" ON public.vehicle_features FOR SELECT TO anon USING (true);
CREATE POLICY "vehicle_features_all_admin" ON public.vehicle_features FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "vehicle_specifications_select_anon" ON public.vehicle_specifications FOR SELECT TO anon USING (true);
CREATE POLICY "vehicle_specifications_all_admin" ON public.vehicle_specifications FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "vehicle_status_select_admin" ON public.vehicle_status FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "vehicle_status_all_admin" ON public.vehicle_status FOR ALL TO authenticated USING (is_admin());

-- ─── REFERENCE TABLES (public read) ───────────────────────────────────────────

CREATE POLICY "manufacturers_select_anon" ON public.manufacturers FOR SELECT TO anon USING (true);
CREATE POLICY "manufacturers_select_auth" ON public.manufacturers FOR SELECT TO authenticated USING (true);
CREATE POLICY "manufacturers_all_admin" ON public.manufacturers FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "models_select_anon" ON public.models FOR SELECT TO anon USING (true);
CREATE POLICY "models_select_auth" ON public.models FOR SELECT TO authenticated USING (true);
CREATE POLICY "models_all_admin" ON public.models FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "body_types_select_anon" ON public.body_types FOR SELECT TO anon USING (true);
CREATE POLICY "body_types_select_auth" ON public.body_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "body_types_all_admin" ON public.body_types FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "fuel_types_select_anon" ON public.fuel_types FOR SELECT TO anon USING (true);
CREATE POLICY "fuel_types_select_auth" ON public.fuel_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "fuel_types_all_admin" ON public.fuel_types FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "transmissions_select_anon" ON public.transmissions FOR SELECT TO anon USING (true);
CREATE POLICY "transmissions_select_auth" ON public.transmissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "transmissions_all_admin" ON public.transmissions FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "drive_types_select_anon" ON public.drive_types FOR SELECT TO anon USING (true);
CREATE POLICY "drive_types_select_auth" ON public.drive_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "drive_types_all_admin" ON public.drive_types FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "colors_select_anon" ON public.colors FOR SELECT TO anon USING (true);
CREATE POLICY "colors_select_auth" ON public.colors FOR SELECT TO authenticated USING (true);
CREATE POLICY "colors_all_admin" ON public.colors FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "countries_select_anon" ON public.countries FOR SELECT TO anon USING (true);
CREATE POLICY "countries_select_auth" ON public.countries FOR SELECT TO authenticated USING (true);
CREATE POLICY "countries_all_admin" ON public.countries FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "ports_select_anon" ON public.ports FOR SELECT TO anon USING (true);
CREATE POLICY "ports_select_auth" ON public.ports FOR SELECT TO authenticated USING (true);
CREATE POLICY "ports_all_admin" ON public.ports FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "currencies_select_anon" ON public.currencies FOR SELECT TO anon USING (true);
CREATE POLICY "currencies_select_auth" ON public.currencies FOR SELECT TO authenticated USING (true);
CREATE POLICY "currencies_all_admin" ON public.currencies FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "languages_select_anon" ON public.languages FOR SELECT TO anon USING (true);
CREATE POLICY "languages_select_auth" ON public.languages FOR SELECT TO authenticated USING (true);
CREATE POLICY "languages_all_admin" ON public.languages FOR ALL TO authenticated USING (is_admin());

-- ─── SETTINGS ─────────────────────────────────────────────────────────────────

CREATE POLICY "site_settings_select_anon" ON public.site_settings FOR SELECT TO anon USING (true);
CREATE POLICY "site_settings_select_auth" ON public.site_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "site_settings_all_admin" ON public.site_settings FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "system_settings_select_admin" ON public.system_settings FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "system_settings_all_admin" ON public.system_settings FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "email_templates_select_admin" ON public.email_templates FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "email_templates_all_admin" ON public.email_templates FOR ALL TO authenticated USING (is_admin());

-- ─── USERS ────────────────────────────────────────────────────────────────────

CREATE POLICY "users_select_own" ON public.users FOR SELECT TO authenticated
  USING (id = auth.uid() OR is_admin());
CREATE POLICY "users_update_own" ON public.users FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "users_all_admin" ON public.users FOR ALL TO authenticated USING (is_admin());

-- ─── PROFILES ─────────────────────────────────────────────────────────────────

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "profiles_all_admin" ON public.profiles FOR ALL TO authenticated USING (is_admin());

-- ─── SESSIONS ─────────────────────────────────────────────────────────────────

CREATE POLICY "sessions_select_own" ON public.sessions FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "sessions_all_admin" ON public.sessions FOR ALL TO authenticated USING (is_admin());

-- ─── ROLES / PERMISSIONS ─────────────────────────────────────────────────────

CREATE POLICY "roles_select_auth" ON public.roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "roles_all_admin" ON public.roles FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "permissions_select_auth" ON public.permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "permissions_all_admin" ON public.permissions FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "role_permissions_select_auth" ON public.role_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "role_permissions_all_admin" ON public.role_permissions FOR ALL TO authenticated USING (is_admin());

-- ─── CUSTOMERS ────────────────────────────────────────────────────────────────

CREATE POLICY "customers_select_own" ON public.customers FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "customers_all_admin" ON public.customers FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "customer_profiles_select_own" ON public.customer_profiles FOR SELECT TO authenticated
  USING (customer_id = get_customer_id_from_user(auth.uid()) OR is_admin());
CREATE POLICY "customer_profiles_update_own" ON public.customer_profiles FOR UPDATE TO authenticated
  USING (customer_id = get_customer_id_from_user(auth.uid())) WITH CHECK (customer_id = get_customer_id_from_user(auth.uid()));
CREATE POLICY "customer_profiles_all_admin" ON public.customer_profiles FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "customer_settings_select_own" ON public.customer_settings FOR SELECT TO authenticated
  USING (customer_id = get_customer_id_from_user(auth.uid()) OR is_admin());
CREATE POLICY "customer_settings_update_own" ON public.customer_settings FOR UPDATE TO authenticated
  USING (customer_id = get_customer_id_from_user(auth.uid())) WITH CHECK (customer_id = get_customer_id_from_user(auth.uid()));
CREATE POLICY "customer_settings_all_admin" ON public.customer_settings FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "customer_addresses_select_own" ON public.customer_addresses FOR SELECT TO authenticated
  USING (customer_id = get_customer_id_from_user(auth.uid()) OR is_admin());
CREATE POLICY "customer_addresses_insert_own" ON public.customer_addresses FOR INSERT TO authenticated
  WITH CHECK (customer_id = get_customer_id_from_user(auth.uid()));
CREATE POLICY "customer_addresses_delete_own" ON public.customer_addresses FOR DELETE TO authenticated
  USING (customer_id = get_customer_id_from_user(auth.uid()));
CREATE POLICY "customer_addresses_all_admin" ON public.customer_addresses FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "customer_wishlist_select_own" ON public.customer_wishlist FOR SELECT TO authenticated
  USING (customer_id = get_customer_id_from_user(auth.uid()) OR is_admin());
CREATE POLICY "customer_wishlist_insert_own" ON public.customer_wishlist FOR INSERT TO authenticated
  WITH CHECK (customer_id = get_customer_id_from_user(auth.uid()));
CREATE POLICY "customer_wishlist_delete_own" ON public.customer_wishlist FOR DELETE TO authenticated
  USING (customer_id = get_customer_id_from_user(auth.uid()));
CREATE POLICY "customer_wishlist_all_admin" ON public.customer_wishlist FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "customer_alerts_select_own" ON public.customer_alerts FOR SELECT TO authenticated
  USING (customer_id = get_customer_id_from_user(auth.uid()) OR is_admin());
CREATE POLICY "customer_alerts_insert_own" ON public.customer_alerts FOR INSERT TO authenticated
  WITH CHECK (customer_id = get_customer_id_from_user(auth.uid()));
CREATE POLICY "customer_alerts_all_admin" ON public.customer_alerts FOR ALL TO authenticated USING (is_admin());

-- ─── DEALERS ──────────────────────────────────────────────────────────────────

CREATE POLICY "dealers_select_own" ON public.dealers FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "dealers_all_admin" ON public.dealers FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "dealer_profiles_select_own" ON public.dealer_profiles FOR SELECT TO authenticated
  USING (dealer_id IN (SELECT id FROM public.dealers WHERE user_id = auth.uid()) OR is_admin());
CREATE POLICY "dealer_profiles_update_own" ON public.dealer_profiles FOR UPDATE TO authenticated
  USING (dealer_id IN (SELECT id FROM public.dealers WHERE user_id = auth.uid())) WITH CHECK (dealer_id IN (SELECT id FROM public.dealers WHERE user_id = auth.uid()));
CREATE POLICY "dealer_profiles_all_admin" ON public.dealer_profiles FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "dealer_assignments_select_own" ON public.dealer_assignments FOR SELECT TO authenticated
  USING (dealer_id IN (SELECT id FROM public.dealers WHERE user_id = auth.uid()) OR is_admin());
CREATE POLICY "dealer_assignments_all_admin" ON public.dealer_assignments FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "dealer_activity_select_own" ON public.dealer_activity FOR SELECT TO authenticated
  USING (dealer_id IN (SELECT id FROM public.dealers WHERE user_id = auth.uid()) OR is_admin());
CREATE POLICY "dealer_activity_all_admin" ON public.dealer_activity FOR ALL TO authenticated USING (is_admin());

-- ─── ORDERS ───────────────────────────────────────────────────────────────────

CREATE POLICY "orders_select_own" ON public.orders FOR SELECT TO authenticated
  USING (
    customer_id = (SELECT id FROM public.customers WHERE user_id = auth.uid() AND deleted_at IS NULL)
    OR is_dealer_assigned_to_order(id)
    OR is_admin()
  );
CREATE POLICY "orders_insert_auth" ON public.orders FOR INSERT TO authenticated
  WITH CHECK (
    customer_id = (SELECT id FROM public.customers WHERE user_id = auth.uid() AND deleted_at IS NULL)
    OR is_admin()
  );
CREATE POLICY "orders_update_admin" ON public.orders FOR UPDATE TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "orders_delete_admin" ON public.orders FOR DELETE TO authenticated
  USING (is_admin());

-- Order sub-tables: admin only (customer sees via orders)
CREATE POLICY "order_items_select_auth" ON public.order_items FOR SELECT TO authenticated
  USING (is_admin() OR order_id IN (
    SELECT id FROM public.orders WHERE customer_id = (SELECT id FROM public.customers WHERE user_id = auth.uid() AND deleted_at IS NULL)
    OR is_dealer_assigned_to_order(id)
  ));
CREATE POLICY "order_items_all_admin" ON public.order_items FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "order_status_select_auth" ON public.order_status FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "order_status_all_admin" ON public.order_status FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "order_timeline_select_auth" ON public.order_timeline FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "order_timeline_all_admin" ON public.order_timeline FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "order_documents_select_auth" ON public.order_documents FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "order_documents_all_admin" ON public.order_documents FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "order_notes_select_auth" ON public.order_notes FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "order_notes_all_admin" ON public.order_notes FOR ALL TO authenticated USING (is_admin());

-- ─── PAYMENTS ─────────────────────────────────────────────────────────────────

CREATE POLICY "payments_select_own" ON public.payments FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR is_admin()
    OR order_id IN (SELECT id FROM public.orders WHERE customer_id = (SELECT id FROM public.customers WHERE user_id = auth.uid() AND deleted_at IS NULL))
  );
CREATE POLICY "payments_insert_auth" ON public.payments FOR INSERT TO authenticated
  WITH CHECK (is_admin());
CREATE POLICY "payments_update_admin" ON public.payments FOR UPDATE TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "payment_history_select_admin" ON public.payment_history FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "payment_history_all_admin" ON public.payment_history FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "payment_methods_select_own" ON public.payment_methods FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "payment_methods_all_own" ON public.payment_methods FOR ALL TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "invoices_select_auth" ON public.invoices FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "invoices_all_admin" ON public.invoices FOR ALL TO authenticated USING (is_admin());

-- ─── SHIPPING ─────────────────────────────────────────────────────────────────

CREATE POLICY "shipments_select_auth" ON public.shipments FOR SELECT TO authenticated
  USING (
    is_admin()
    OR order_id IN (SELECT id FROM public.orders WHERE customer_id = (SELECT id FROM public.customers WHERE user_id = auth.uid() AND deleted_at IS NULL))
    OR is_dealer_assigned_to_order(order_id)
  );
CREATE POLICY "shipments_all_admin" ON public.shipments FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "shipment_tracking_select_auth" ON public.shipment_tracking FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "shipment_tracking_all_admin" ON public.shipment_tracking FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "containers_select_auth" ON public.containers FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "containers_all_admin" ON public.containers FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "shipping_documents_select_auth" ON public.shipping_documents FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "shipping_documents_all_admin" ON public.shipping_documents FOR ALL TO authenticated USING (is_admin());

-- ─── MESSAGES / NOTIFICATIONS ─────────────────────────────────────────────────

CREATE POLICY "messages_select_own" ON public.messages FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid() OR is_admin());
CREATE POLICY "messages_insert_auth" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());
CREATE POLICY "messages_all_admin" ON public.messages FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "message_threads_select_auth" ON public.message_threads FOR SELECT TO authenticated USING (true);
CREATE POLICY "message_threads_all_admin" ON public.message_threads FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "notifications_all_admin" ON public.notifications FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "email_logs_select_admin" ON public.email_logs FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "email_logs_all_admin" ON public.email_logs FOR ALL TO authenticated USING (is_admin());

-- ─── DOCUMENTS ────────────────────────────────────────────────────────────────

CREATE POLICY "documents_select_auth" ON public.documents FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "documents_all_admin" ON public.documents FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "document_categories_select_auth" ON public.document_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "document_categories_all_admin" ON public.document_categories FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "document_versions_select_auth" ON public.document_versions FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "document_versions_all_admin" ON public.document_versions FOR ALL TO authenticated USING (is_admin());

-- ─── MARKETPLACE ENGAGEMENT ───────────────────────────────────────────────────

CREATE POLICY "featured_vehicles_select_anon" ON public.featured_vehicles FOR SELECT TO anon USING (true);
CREATE POLICY "featured_vehicles_select_auth" ON public.featured_vehicles FOR SELECT TO authenticated USING (true);
CREATE POLICY "featured_vehicles_all_admin" ON public.featured_vehicles FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "vehicle_views_insert_auth" ON public.vehicle_views FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "vehicle_views_select_admin" ON public.vehicle_views FOR SELECT TO authenticated USING (is_admin());

CREATE POLICY "vehicle_compare_select_own" ON public.vehicle_compare FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "vehicle_compare_insert_own" ON public.vehicle_compare FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "vehicle_compare_delete_own" ON public.vehicle_compare FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "vehicle_wishlist_select_own" ON public.vehicle_wishlist FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "vehicle_wishlist_insert_own" ON public.vehicle_wishlist FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "vehicle_wishlist_delete_own" ON public.vehicle_wishlist FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "vehicle_enquiries_insert_auth" ON public.vehicle_enquiries FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "vehicle_enquiries_select_admin" ON public.vehicle_enquiries FOR SELECT TO authenticated USING (is_admin());

-- ─── ANALYTICS ────────────────────────────────────────────────────────────────

CREATE POLICY "analytics_events_insert_auth" ON public.analytics_events FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "analytics_events_select_admin" ON public.analytics_events FOR SELECT TO authenticated USING (is_admin());

CREATE POLICY "page_views_insert_auth" ON public.page_views FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "page_views_select_admin" ON public.page_views FOR SELECT TO authenticated USING (is_admin());

CREATE POLICY "search_history_insert_auth" ON public.search_history FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "search_history_select_admin" ON public.search_history FOR SELECT TO authenticated USING (is_admin());

-- ─── EXCHANGE RATES ───────────────────────────────────────────────────────────

CREATE POLICY "exchange_rates_select_anon" ON public.exchange_rates FOR SELECT TO anon USING (true);
CREATE POLICY "exchange_rates_select_auth" ON public.exchange_rates FOR SELECT TO authenticated USING (true);
CREATE POLICY "exchange_rates_all_admin" ON public.exchange_rates FOR ALL TO authenticated USING (is_admin());
