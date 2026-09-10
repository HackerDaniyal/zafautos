export type UserRole = 'customer' | 'dealer' | 'admin' | 'super_admin';
export type UserStatus = 'active' | 'inactive' | 'suspended';
export type VehicleCondition = 'new' | 'used' | 'certified';
export type VehicleStatus = 'draft' | 'active' | 'sold' | 'reserved';
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'partially_refunded';
export type PaymentTransactionType = 'deposit' | 'balance' | 'refund' | 'adjustment';
export type ShipmentStatus = 'pending' | 'booked' | 'picked_up' | 'in_transit' | 'arrived' | 'delivered' | 'delayed' | 'exception' | 'cancelled';
export type TicketCategory = 'general' | 'order' | 'payment' | 'shipping' | 'technical' | 'other';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type SenderType = 'customer' | 'admin' | 'system';

export interface UserData {
  id: string;
  email: string;
  roleId: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProfileData {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface CustomerData {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerAddressData {
  id: string;
  customerId: string;
  addressLine: string;
  city: string;
  country: string;
  postalCode: string;
}

export interface CustomerWishlistData {
  id: string;
  customerId: string;
  vehicleId: string;
}

export interface VehicleData {
  id: string;
  vin: string;
  stockNumber: string;
  manufacturerId: string;
  modelId: string;
  bodyTypeId: string;
  fuelTypeId: string;
  transmissionId: string;
  driveTypeId: string;
  colorId: string;
  year: number;
  engineCc: number;
  horsepower: number;
  mileage: number;
  doors: number;
  seats: number;
  price: number;
  currencyId: string;
  auctionGrade: number | null;
  condition: VehicleCondition;
  countryId: string;
  portId: string;
  status: VehicleStatus;
  slug: string;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface VehicleImageData {
  id: string;
  vehicleId: string;
  imageUrl: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface OrderData {
  id: string;
  orderNumber: string;
  customerId: string;
  dealerId: string;
  vehicleId: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentData {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: string;
  referenceNumber: string;
}

export interface PaymentTransactionData {
  id: string;
  paymentId: string;
  orderId: string;
  type: PaymentTransactionType;
  amount: number;
  method: string;
  referenceNumber: string;
  transactionDate: Date;
}

export interface ShipmentData {
  id: string;
  orderId: string;
  status: ShipmentStatus;
  carrier: string;
  trackingNumber: string;
  vessel: string | null;
  bookingReference: string | null;
  shippingCost: number;
  originPortId: string;
  destinationPortId: string;
  estimatedDeparture: Date | null;
  estimatedArrival: Date | null;
  actualDeparture: Date | null;
  actualArrival: Date | null;
}

export interface ShipmentTrackingData {
  id: string;
  shipmentId: string;
  location: string;
  note: string;
}

export interface SupportTicketData {
  id: string;
  customerId: string;
  orderId: string | null;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo: string | null;
}

export interface SupportTicketMessageData {
  id: string;
  ticketId: string;
  senderId: string;
  senderType: SenderType;
  message: string;
}

export interface RoleData {
  id: string;
  name: string;
  slug: string;
}

export interface PermissionData {
  id: string;
  name: string;
  slug: string;
}

export interface RolePermissionData {
  id: string;
  roleId: string;
  permissionId: string;
}

export interface CurrencyData {
  id: string;
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
  symbolPosition: 'before' | 'after';
  isDefault: boolean;
  exchangeRate: number;
  isActive: boolean;
}

let counter = 0;
function nextCounter(): number {
  return ++counter;
}

function createDefaults<T>(defaults: T, overrides?: Partial<T>): T {
  return { ...defaults, ...overrides } as T;
}

export function createUserData(overrides?: Partial<UserData>): UserData {
  return createDefaults(
    {
      id: crypto.randomUUID(),
      email: `user${nextCounter()}@example.com`,
      roleId: crypto.randomUUID(),
      role: 'customer' as UserRole,
      status: 'active' as UserStatus,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    overrides,
  );
}

export function createProfileData(overrides?: Partial<ProfileData>): ProfileData {
  return createDefaults(
    {
      id: crypto.randomUUID(),
      userId: crypto.randomUUID(),
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567890',
    },
    overrides,
  );
}

export function createCustomerData(overrides?: Partial<CustomerData>): CustomerData {
  return createDefaults(
    {
      id: crypto.randomUUID(),
      userId: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    overrides,
  );
}

export function createCustomerAddressData(overrides?: Partial<CustomerAddressData>): CustomerAddressData {
  return createDefaults(
    {
      id: crypto.randomUUID(),
      customerId: crypto.randomUUID(),
      addressLine: '123 Main Street',
      city: 'Dubai',
      country: 'AE',
      postalCode: '00000',
    },
    overrides,
  );
}

export function createVehicleData(overrides?: Partial<VehicleData>): VehicleData {
  const year = overrides?.year ?? 2024;
  const manufacturer = overrides?.manufacturerId ?? 'Toyota';
  const model = overrides?.modelId ?? 'Land Cruiser';

  return createDefaults(
    {
      id: crypto.randomUUID(),
      vin: `VIN${nextCounter().toString().padStart(13, '0')}A`,
      stockNumber: `STK${nextCounter().toString().padStart(5, '0')}`,
      manufacturerId: crypto.randomUUID(),
      modelId: crypto.randomUUID(),
      bodyTypeId: crypto.randomUUID(),
      fuelTypeId: crypto.randomUUID(),
      transmissionId: crypto.randomUUID(),
      driveTypeId: crypto.randomUUID(),
      colorId: crypto.randomUUID(),
      year,
      engineCc: 4000,
      horsepower: 275,
      mileage: 0,
      doors: 5,
      seats: 7,
      price: 1500000,
      currencyId: crypto.randomUUID(),
      auctionGrade: null,
      condition: 'new' as VehicleCondition,
      countryId: crypto.randomUUID(),
      portId: crypto.randomUUID(),
      status: 'active' as VehicleStatus,
      slug: `vehicle-${year}-${manufacturer.toLowerCase()}-${model.toLowerCase().replace(/\s+/g, '-')}-${nextCounter()}`,
      isFeatured: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
    overrides,
  );
}

export function createVehicleImageData(overrides?: Partial<VehicleImageData>): VehicleImageData {
  return createDefaults(
    {
      id: crypto.randomUUID(),
      vehicleId: crypto.randomUUID(),
      imageUrl: `https://example.com/images/vehicle-${nextCounter()}.jpg`,
      sortOrder: 0,
      isPrimary: true,
    },
    overrides,
  );
}

export function createOrderData(overrides?: Partial<OrderData>): OrderData {
  const orderNum = nextCounter();
  return createDefaults(
    {
      id: crypto.randomUUID(),
      orderNumber: `ORD-${orderNum.toString().padStart(6, '0')}`,
      customerId: crypto.randomUUID(),
      dealerId: crypto.randomUUID(),
      vehicleId: crypto.randomUUID(),
      status: 'pending' as OrderStatus,
      totalAmount: 1500000,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    overrides,
  );
}

export function createPaymentData(overrides?: Partial<PaymentData>): PaymentData {
  const paymentNum = nextCounter();
  return createDefaults(
    {
      id: crypto.randomUUID(),
      orderId: crypto.randomUUID(),
      userId: crypto.randomUUID(),
      amount: 1500000,
      currency: 'AED',
      status: 'pending' as PaymentStatus,
      paymentMethod: 'bank_transfer',
      referenceNumber: `PAY-${paymentNum.toString().padStart(8, '0')}`,
    },
    overrides,
  );
}

export function createPaymentTransactionData(
  overrides?: Partial<PaymentTransactionData>,
): PaymentTransactionData {
  return createDefaults(
    {
      id: crypto.randomUUID(),
      paymentId: crypto.randomUUID(),
      orderId: crypto.randomUUID(),
      type: 'deposit' as PaymentTransactionType,
      amount: 500000,
      method: 'bank_transfer',
      referenceNumber: `TXN-${nextCounter().toString().padStart(8, '0')}`,
      transactionDate: new Date(),
    },
    overrides,
  );
}

export function createShipmentData(overrides?: Partial<ShipmentData>): ShipmentData {
  return createDefaults(
    {
      id: crypto.randomUUID(),
      orderId: crypto.randomUUID(),
      status: 'pending' as ShipmentStatus,
      carrier: 'Maersk',
      trackingNumber: `TRK-${nextCounter().toString().padStart(8, '0')}`,
      vessel: null,
      bookingReference: null,
      shippingCost: 75000,
      originPortId: crypto.randomUUID(),
      destinationPortId: crypto.randomUUID(),
      estimatedDeparture: null,
      estimatedArrival: null,
      actualDeparture: null,
      actualArrival: null,
    },
    overrides,
  );
}

export function createShipmentTrackingData(
  overrides?: Partial<ShipmentTrackingData>,
): ShipmentTrackingData {
  return createDefaults(
    {
      id: crypto.randomUUID(),
      shipmentId: crypto.randomUUID(),
      location: 'Dubai, UAE',
      note: 'Shipment registered',
    },
    overrides,
  );
}

export function createSupportTicketData(
  overrides?: Partial<SupportTicketData>,
): SupportTicketData {
  return createDefaults(
    {
      id: crypto.randomUUID(),
      customerId: crypto.randomUUID(),
      orderId: null,
      subject: 'Inquiry about vehicle availability',
      description: 'I would like to know the availability of the selected vehicle.',
      category: 'general' as TicketCategory,
      priority: 'medium' as TicketPriority,
      status: 'open' as TicketStatus,
      assignedTo: null,
    },
    overrides,
  );
}

export function createSupportTicketMessageData(
  overrides?: Partial<SupportTicketMessageData>,
): SupportTicketMessageData {
  return createDefaults(
    {
      id: crypto.randomUUID(),
      ticketId: crypto.randomUUID(),
      senderId: crypto.randomUUID(),
      senderType: 'customer' as SenderType,
      message: 'Hello, I have a question about my order.',
    },
    overrides,
  );
}

export function createRoleData(overrides?: Partial<RoleData>): RoleData {
  return createDefaults(
    {
      id: crypto.randomUUID(),
      name: 'Customer',
      slug: 'customer',
    },
    overrides,
  );
}

export function createPermissionData(overrides?: Partial<PermissionData>): PermissionData {
  return createDefaults(
    {
      id: crypto.randomUUID(),
      name: 'View Vehicles',
      slug: 'view-vehicles',
    },
    overrides,
  );
}

export function createRolePermissionData(overrides?: Partial<RolePermissionData>): RolePermissionData {
  return createDefaults(
    {
      id: crypto.randomUUID(),
      roleId: crypto.randomUUID(),
      permissionId: crypto.randomUUID(),
    },
    overrides,
  );
}

export function createCurrencyData(overrides?: Partial<CurrencyData>): CurrencyData {
  return createDefaults(
    {
      id: crypto.randomUUID(),
      code: 'AED',
      name: 'UAE Dirham',
      symbol: 'AED',
      decimalPlaces: 2,
      symbolPosition: 'before' as const,
      isDefault: true,
      exchangeRate: 1,
      isActive: true,
    },
    overrides,
  );
}
