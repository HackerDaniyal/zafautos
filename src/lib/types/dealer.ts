import type {
  dealers,
  dealerProfiles,
  dealerAssignments,
  dealerActivity,
} from '@/server/db/schema';
import type { users, profiles } from '@/server/db/schema/auth';
import type { orders } from '@/server/db/schema/orders';
import type { shipments } from '@/server/db/schema/shipping';
import type { documents } from '@/server/db/schema/documents';

export type Dealer = typeof dealers.$inferSelect;
export type DealerInsert = typeof dealers.$inferInsert;
export type DealerProfile = typeof dealerProfiles.$inferSelect;
export type DealerAssignment = typeof dealerAssignments.$inferSelect;
export type DealerActivityLog = typeof dealerActivity.$inferSelect;

export type DealerStatus = 'active' | 'pending' | 'suspended' | 'archived';

export const DEALER_STATUS_TRANSITIONS: Record<DealerStatus, DealerStatus[]> = {
  active: ['suspended', 'archived'],
  pending: ['active', 'suspended', 'archived'],
  suspended: ['active', 'archived'],
  archived: ['active'],
};

export function isValidDealerTransition(from: DealerStatus, to: DealerStatus): boolean {
  return DEALER_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export interface DealerWithRelations extends Dealer {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  phone?: string | null;
  countryId?: string | null;
  avatarUrl?: string | null;
  status: string;
  orderCount?: number;
  totalRevenue?: number;
  lastOrderDate?: Date | null;
}

export interface DealerDetail extends Dealer {
  email: string;
  status: string;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  phone?: string | null;
  countryId?: string | null;
  avatarUrl?: string | null;
  profile: DealerProfile | null;
  orders: (typeof orders.$inferSelect)[];
  shipments: (typeof shipments.$inferSelect)[];
  assignments: DealerAssignment[];
  documents: (typeof documents.$inferSelect)[];
  activity: DealerActivityLog[];
}

export interface DealerListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: DealerStatus;
  countryId?: string;
  dateFrom?: string;
  dateTo?: string;
  hasOrders?: boolean;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface DealerStats {
  totalDealers: number;
  activeDealers: number;
  pendingDealers: number;
  suspendedDealers: number;
  archivedDealers: number;
  newThisMonth: number;
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
}
