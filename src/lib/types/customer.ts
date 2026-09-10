import type {
  customers,
  customerProfiles,
  customerAddresses,
  customerSettings,
  customerWishlist,
  customerAlerts,
} from '@/server/db/schema';
import type { users, profiles } from '@/server/db/schema/auth';
import type { orders } from '@/server/db/schema/orders';
import type { payments } from '@/server/db/schema/payments';
import type { shipments } from '@/server/db/schema/shipping';
import type { documents } from '@/server/db/schema/documents';
import type { auditLogs } from '@/server/db/schema/audit';

export type Customer = typeof customers.$inferSelect;
export type CustomerInsert = typeof customers.$inferInsert;
export type CustomerProfile = typeof customerProfiles.$inferSelect;
export type CustomerAddress = typeof customerAddresses.$inferSelect;
export type CustomerSetting = typeof customerSettings.$inferSelect;
export type CustomerWishlistEntry = typeof customerWishlist.$inferSelect;
export type CustomerAlert = typeof customerAlerts.$inferSelect;

export type CustomerStatus = 'active' | 'pending' | 'suspended' | 'blocked';

export const CUSTOMER_STATUS_TRANSITIONS: Record<CustomerStatus, CustomerStatus[]> = {
  active: ['suspended', 'blocked'],
  pending: ['active', 'blocked'],
  suspended: ['active', 'blocked'],
  blocked: ['active'],
};

export function isValidCustomerTransition(from: CustomerStatus, to: CustomerStatus): boolean {
  return CUSTOMER_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export interface CustomerWithRelations extends Customer {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  phone?: string | null;
  countryId?: string | null;
  avatarUrl?: string | null;
  status: string;
  orderCount?: number;
  totalSpent?: number;
  lastOrderDate?: Date | null;
}

export interface CustomerDetail extends Customer {
  email: string;
  status: string;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  phone?: string | null;
  countryId?: string | null;
  avatarUrl?: string | null;
  timezone?: string | null;
  languageId?: string | null;
  profile: CustomerProfile | null;
  addresses: CustomerAddress[];
  settings: CustomerSetting | null;
  orders: (typeof orders.$inferSelect)[];
  payments: (typeof payments.$inferSelect)[];
  shipments: (typeof shipments.$inferSelect)[];
  wishlist: CustomerWishlistEntry[];
  documents: (typeof documents.$inferSelect)[];
  alerts: CustomerAlert[];
}

export interface CustomerListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: CustomerStatus;
  countryId?: string;
  dateFrom?: string;
  dateTo?: string;
  hasOrders?: boolean;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  pendingCustomers: number;
  suspendedCustomers: number;
  blockedCustomers: number;
  newThisMonth: number;
  returningCustomers: number;
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
}
