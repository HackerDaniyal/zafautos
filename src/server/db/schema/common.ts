import { pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role_enum', ['customer', 'dealer', 'admin', 'super_admin']);
export const userStatusEnum = pgEnum('user_status_enum', ['active', 'pending', 'suspended', 'blocked']);
export const vehicleStatusEnum = pgEnum('vehicle_status_enum', ['draft', 'active', 'sold', 'archived']);
export const orderStatusEnum = pgEnum('order_status_enum', ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']);
export const paymentStatusEnum = pgEnum('payment_status_enum', ['pending', 'paid', 'failed', 'refunded']);
export const shipmentStatusEnum = pgEnum('shipment_status_enum', ['pending', 'booked', 'picked_up', 'in_transit', 'arrived', 'delivered', 'delayed', 'exception', 'cancelled']);
export const shippingDocumentTypeEnum = pgEnum('shipping_document_type_enum', ['bill_of_lading', 'export_certificate', 'inspection_report', 'insurance', 'commercial_invoice', 'packing_list', 'photos', 'other']);
export const notificationStatusEnum = pgEnum('notification_status_enum', ['unread', 'read', 'archived']);
export const taxTypeEnum = pgEnum('tax_type_enum', ['percentage', 'fixed']);
export const cmsPageStatusEnum = pgEnum('cms_page_status_enum', ['draft', 'published', 'archived']);
export const homepageSectionTypeEnum = pgEnum('homepage_section_type_enum', [
  'hero', 'search', 'featured_vehicles', 'latest_vehicles',
  'browse_make', 'browse_body_type', 'browse_country', 'browse_continent', 'browse_currency',
  'why_choose_us', 'statistics', 'testimonials', 'faq', 'cta', 'footer',
  'how_it_works',
]);
export const blogPostStatusEnum = pgEnum('blog_post_status_enum', ['draft', 'published', 'archived']);
export const menuLocationEnum = pgEnum('menu_location_enum', ['header', 'footer', 'mobile']);
export const leadStatusEnum = pgEnum('lead_status_enum', ['new', 'contacted', 'qualified', 'negotiating', 'converted', 'lost']);
export const leadSourceEnum = pgEnum('lead_source_enum', ['website', 'whatsapp', 'phone', 'email', 'walk_in', 'other']);
export const supportTicketStatusEnum = pgEnum('support_ticket_status_enum', ['open', 'in_progress', 'waiting_customer', 'resolved', 'closed']);
export const supportTicketPriorityEnum = pgEnum('support_ticket_priority_enum', ['low', 'medium', 'high', 'urgent']);
export const supportTicketCategoryEnum = pgEnum('support_ticket_category_enum', ['general', 'order', 'payment', 'shipping', 'document', 'vehicle', 'technical', 'other']);
export const supportSenderTypeEnum = pgEnum('support_sender_type_enum', ['customer', 'staff', 'system']);
export const notificationCategoryEnum = pgEnum('notification_category_enum', ['order', 'payment', 'shipping', 'support', 'lead', 'vehicle', 'system']);
