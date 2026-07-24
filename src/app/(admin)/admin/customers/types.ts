export type {
  Customer,
  CustomerInsert,
  CustomerProfile,
  CustomerAddress,
  CustomerSetting,
  CustomerWishlistEntry,
  CustomerAlert,
  CustomerStatus,
  CustomerWithRelations,
  CustomerDetail,
  CustomerListParams,
  CustomerStats,
} from '@/lib/types/customer';

export { CUSTOMER_STATUS_TRANSITIONS, isValidCustomerTransition } from '@/lib/types/customer';
