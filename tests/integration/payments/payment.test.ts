import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isValidPaymentTransition, PAYMENT_STATUS_TRANSITIONS, type PaymentStatus } from '@/lib/types/payment';

const UUID_PAY = '550e8400-e29b-41d4-a716-446655440020';
const UUID_ORDER = '550e8400-e29b-41d4-a716-446655440010';
const UUID_USER = '550e8400-e29b-41d4-a716-446655440011';

const mockPaymentCreate = vi.fn();
const mockPaymentFindByOrderId = vi.fn();
const mockPaymentFindByUserId = vi.fn();
const mockPaymentFindById = vi.fn();
const mockPaymentUpdateStatus = vi.fn();
const mockPaymentRecordHistory = vi.fn();
const mockPaymentGetPaymentWithTransactions = vi.fn();
const mockPaymentSoftDelete = vi.fn();
const mockPaymentRestore = vi.fn();
const mockPaymentUpdatePaymentStatusWithHistory = vi.fn();
const mockPaymentAddPaymentHistory = vi.fn();

vi.mock('@/server/services/auditService', () => ({
  auditService: { logAction: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock('@/server/services/notificationService', () => ({
  notificationService: { dispatch: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock('@/server/db/client', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
  },
}));

vi.mock('@/server/db/schema', () => ({
  orders: { customerId: 'customerId', id: 'id' },
  paymentHistory: { id: 'id' },
  paymentTransactions: { id: 'id' },
  payments: { id: 'id', orderId: 'orderId' },
  invoices: { id: 'id' },
}));

vi.mock('@/server/repositories/paymentsRepository', () => ({
  PaymentsRepository: vi.fn().mockImplementation(function () {
    return {
      payments: {
        findById: mockPaymentFindById,
        create: mockPaymentCreate,
      },
      history: {
        create: mockPaymentRecordHistory,
        delete: vi.fn().mockResolvedValue({}),
      },
      invoices: {
        findById: vi.fn().mockResolvedValue(null),
      },
      createPayment: mockPaymentCreate,
      findByOrderId: mockPaymentFindByOrderId,
      findByUserId: mockPaymentFindByUserId,
      updatePaymentStatus: mockPaymentUpdateStatus,
      recordHistory: mockPaymentRecordHistory,
      getPaymentWithTransactions: mockPaymentGetPaymentWithTransactions,
      softDeletePayment: mockPaymentSoftDelete,
      restorePayment: mockPaymentRestore,
      updatePaymentStatusWithHistory: mockPaymentUpdatePaymentStatusWithHistory,
      addPaymentHistory: mockPaymentAddPaymentHistory,
      getPaymentHistory: vi.fn().mockResolvedValue([]),
      createInvoiceWithNumber: vi.fn().mockResolvedValue({}),
      updateInvoice: vi.fn().mockResolvedValue({}),
      softDeleteInvoice: vi.fn().mockResolvedValue({}),
      restoreInvoice: vi.fn().mockResolvedValue({}),
      getInvoiceWithRelations: vi.fn().mockResolvedValue(null),
      getInvoicesByOrderId: vi.fn().mockResolvedValue([]),
      getInvoiceById: vi.fn().mockResolvedValue(null),
      generateInvoiceNumber: vi.fn().mockResolvedValue('INV-001'),
      createTransaction: vi.fn().mockResolvedValue({ id: UUID_PAY }),
      getTransactionsByPaymentId: vi.fn().mockResolvedValue([]),
      getTransactionsByOrderId: vi.fn().mockResolvedValue([]),
      getTransactionById: vi.fn().mockResolvedValue(null),
      updateTransaction: vi.fn().mockResolvedValue({}),
      softDeleteTransaction: vi.fn().mockResolvedValue({}),
      restoreTransaction: vi.fn().mockResolvedValue({}),
      getPaymentMethodsByUserId: vi.fn().mockResolvedValue([]),
      createPaymentMethod: vi.fn().mockResolvedValue({}),
      getDefaultPaymentMethod: vi.fn().mockResolvedValue(null),
      listPayments: vi.fn().mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } }),
      listInvoices: vi.fn().mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } }),
      getPaymentStats: vi.fn().mockResolvedValue({}),
      getCustomerFinance: vi.fn().mockResolvedValue({}),
      getOrderFinance: vi.fn().mockResolvedValue({}),
    };
  }),
}));

function makePayment(overrides: Record<string, any> = {}) {
  return {
    id: UUID_PAY,
    orderId: UUID_ORDER,
    userId: UUID_USER,
    amount: 500000,
    currency: 'USD',
    status: 'pending' as PaymentStatus,
    paymentMethod: 'bank_transfer',
    referenceNumber: 'REF-001',
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('Payment - Status Transition Validation', () => {
  it('allows pending → paid', () => {
    expect(isValidPaymentTransition('pending', 'paid')).toBe(true);
  });

  it('allows pending → failed', () => {
    expect(isValidPaymentTransition('pending', 'failed')).toBe(true);
  });

  it('allows paid → refunded', () => {
    expect(isValidPaymentTransition('paid', 'refunded')).toBe(true);
  });

  it('allows failed → pending', () => {
    expect(isValidPaymentTransition('failed', 'pending')).toBe(true);
  });

  it('rejects pending → refunded', () => {
    expect(isValidPaymentTransition('pending', 'refunded')).toBe(false);
  });

  it('rejects refunded → any status', () => {
    expect(PAYMENT_STATUS_TRANSITIONS['refunded']).toHaveLength(0);
  });

  it('rejects paid → pending', () => {
    expect(isValidPaymentTransition('paid', 'pending')).toBe(false);
  });

  it('rejects paid → failed', () => {
    expect(isValidPaymentTransition('paid', 'failed')).toBe(false);
  });

  it('rejects failed → paid', () => {
    expect(isValidPaymentTransition('failed', 'paid')).toBe(false);
  });

  it('rejects failed → refunded', () => {
    expect(isValidPaymentTransition('failed', 'refunded')).toBe(false);
  });
});

describe('Payment - Creation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a payment successfully', async () => {
    mockPaymentCreate.mockResolvedValue({ id: UUID_PAY, amount: 500000 });

    const { PaymentService } = await import('@/server/services/paymentService');
    const service = new PaymentService();
    const result = await service.createPayment({
      orderId: UUID_ORDER,
      amount: 500000,
      currency: 'USD',
      status: 'pending',
      paymentMethod: 'bank_transfer',
    });

    expect(result).toBeDefined();
    expect(mockPaymentCreate).toHaveBeenCalled();
  });

  it('creates a payment with default status pending', async () => {
    mockPaymentCreate.mockResolvedValue({ id: UUID_PAY, status: 'pending' });

    const { PaymentService } = await import('@/server/services/paymentService');
    const service = new PaymentService();
    const result = await service.createPayment({
      orderId: UUID_ORDER,
      amount: 100000,
      currency: 'JPY',
    } as any);

    expect(result).toBeDefined();
  });

  it('rejects payment with invalid order ID', async () => {
    const { PaymentService } = await import('@/server/services/paymentService');
    const service = new PaymentService();

    await expect(
      service.createPayment({
        orderId: 'not-a-uuid',
        amount: 100,
        currency: 'USD',
        status: 'pending',
      })
    ).rejects.toThrow();
  });
});

describe('Payment - Status Changes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('transitions from pending to paid', async () => {
    const payment = makePayment({ status: 'pending' });
    mockPaymentFindById.mockResolvedValue(payment);
    mockPaymentUpdateStatus.mockResolvedValue({ ...payment, status: 'paid' });
    mockPaymentRecordHistory.mockResolvedValue({});

    const { PaymentService } = await import('@/server/services/paymentService');
    const service = new PaymentService();
    const result = await service.updatePaymentStatus(payment.id, 'paid');

    expect(result).toBeDefined();
    expect(mockPaymentUpdateStatus).toHaveBeenCalledWith(payment.id, 'paid');
  });

  it('transitions from paid to refunded', async () => {
    const payment = makePayment({ status: 'paid' });
    mockPaymentFindById.mockResolvedValue(payment);
    mockPaymentUpdateStatus.mockResolvedValue({ ...payment, status: 'refunded' });
    mockPaymentRecordHistory.mockResolvedValue({});

    const { PaymentService } = await import('@/server/services/paymentService');
    const service = new PaymentService();
    const result = await service.updatePaymentStatus(payment.id, 'refunded');

    expect(result).toBeDefined();
  });

  it('rejects invalid transition from pending to refunded', async () => {
    const payment = makePayment({ status: 'pending' });
    mockPaymentFindById.mockResolvedValue(payment);

    const { PaymentService } = await import('@/server/services/paymentService');
    const service = new PaymentService();

    await expect(service.updatePaymentStatus(payment.id, 'refunded')).rejects.toThrow('Invalid status transition');
  });

  it('throws PaymentNotFoundError for nonexistent payment', async () => {
    mockPaymentFindById.mockResolvedValue(null);

    const { PaymentService } = await import('@/server/services/paymentService');
    const service = new PaymentService();

    await expect(service.updatePaymentStatus('nonexistent', 'paid')).rejects.toThrow('Payment not found');
  });

  it('throws ValidationError for empty paymentId', async () => {
    const { PaymentService } = await import('@/server/services/paymentService');
    const service = new PaymentService();

    await expect(service.updatePaymentStatus('', 'paid')).rejects.toThrow('Payment ID is required');
  });
});

describe('Payment - Transactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a transaction', async () => {
    const { PaymentService } = await import('@/server/services/paymentService');
    const service = new PaymentService();
    const result = await service.createTransaction({
      paymentId: UUID_PAY,
      orderId: UUID_ORDER,
      type: 'deposit',
      amount: 100000,
      method: 'bank_transfer',
    });

    expect(result).toBeDefined();
    expect(result.id).toBe(UUID_PAY);
  });

  it('rejects transaction with neither paymentId nor orderId', async () => {
    const { PaymentService } = await import('@/server/services/paymentService');
    const service = new PaymentService();

    await expect(
      service.createTransaction({
        type: 'deposit',
        amount: 100,
        method: 'cash',
      })
    ).rejects.toThrow('Either paymentId or orderId is required');
  });
});

describe('Payment - Financial Records Integrity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('cannot delete already-deleted payment', async () => {
    const payment = makePayment({ deletedAt: new Date() });
    mockPaymentFindById.mockResolvedValue(payment);

    const { PaymentService } = await import('@/server/services/paymentService');
    const service = new PaymentService();

    await expect(service.softDeletePayment(payment.id)).rejects.toThrow('already deleted');
  });

  it('cannot restore non-deleted payment', async () => {
    const payment = makePayment({ deletedAt: null });
    mockPaymentFindById.mockResolvedValue(payment);

    const { PaymentService } = await import('@/server/services/paymentService');
    const service = new PaymentService();

    await expect(service.restorePayment(payment.id)).rejects.toThrow('not deleted');
  });

  it('soft deletes a payment', async () => {
    const payment = makePayment({ deletedAt: null });
    mockPaymentFindById.mockResolvedValue(payment);
    mockPaymentSoftDelete.mockResolvedValue({ ...payment, deletedAt: new Date() });

    const { PaymentService } = await import('@/server/services/paymentService');
    const service = new PaymentService();
    const result = await service.softDeletePayment(payment.id);

    expect(result).toBeDefined();
    expect(mockPaymentSoftDelete).toHaveBeenCalledWith(payment.id, undefined);
  });

  it('restores a soft-deleted payment', async () => {
    const payment = makePayment({ deletedAt: new Date() });
    mockPaymentFindById.mockResolvedValue(payment);
    mockPaymentRestore.mockResolvedValue({ ...payment, deletedAt: null });

    const { PaymentService } = await import('@/server/services/paymentService');
    const service = new PaymentService();
    const result = await service.restorePayment(payment.id);

    expect(result).toBeDefined();
    expect(mockPaymentRestore).toHaveBeenCalledWith(payment.id);
  });
});
