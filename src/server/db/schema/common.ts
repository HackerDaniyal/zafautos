import { pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role_enum', ['customer', 'dealer', 'admin', 'super_admin']);
export const userStatusEnum = pgEnum('user_status_enum', ['active', 'pending', 'suspended', 'blocked']);
export const vehicleStatusEnum = pgEnum('vehicle_status_enum', ['draft', 'active', 'sold', 'archived']);
export const orderStatusEnum = pgEnum('order_status_enum', ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']);
export const paymentStatusEnum = pgEnum('payment_status_enum', ['pending', 'paid', 'failed', 'refunded']);
export const shipmentStatusEnum = pgEnum('shipment_status_enum', ['pending', 'in_transit', 'delivered', 'delayed', 'cancelled']);
export const notificationStatusEnum = pgEnum('notification_status_enum', ['unread', 'read', 'archived']);
export const taxTypeEnum = pgEnum('tax_type_enum', ['percentage', 'fixed']);
export const cmsPageStatusEnum = pgEnum('cms_page_status_enum', ['draft', 'published', 'archived']);
export const homepageSectionTypeEnum = pgEnum('homepage_section_type_enum', [
  'hero', 'search', 'featured_vehicles', 'latest_vehicles',
  'browse_make', 'browse_body_type', 'browse_country', 'browse_continent',
  'why_choose_us', 'statistics', 'testimonials', 'faq', 'cta', 'footer',
]);
export const menuLocationEnum = pgEnum('menu_location_enum', ['header', 'footer', 'mobile']);
