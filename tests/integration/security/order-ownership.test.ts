import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import type { AuthContext } from '@/lib/auth/types';

/**
 * Phase D3 / H7 — order & payment ownership (IDOR) regression suite.
 *
 * Behavioral tests: real route handlers, real orderAccess helpers and real
 * action code run against a queue-backed fake db; only the session, RBAC
 * permission gate, service layer and audit logger are mocked.
 *
 * Checklist covered:
 *  1. customer A cannot read customer B's orders
 *  2. dealer A cannot read dealer B's orders
 *  3. dealer A cannot reach customer orders via customerId
 *  4. admin legitimate access remains
 *  5. POST cannot forge customer/dealer ownership
 *  6. POST cannot forge initial status
 *  7. URL payment identity cannot be overridden by the body
 *  8. unauthorized order mutation fails
 *  9. valid ownership paths continue working
 */

const USER_CUSTOMER_A = '550e8400-e29b-41d4-a716-446655440010';
const USER_CUSTOMER_B = '550e8400-e29b-41d4-a716-446655440011';
const USER_DEALER_A = '550e8400-e29b-41d4-a716-446655440012';
const USER_ADMIN = '550e8400-e29b-41d4-a716-446655440013';
const USER_UNRELATED = '550e8400-e29b-41d4-a716-446655440014';

const CUST_RECORD_A = '550e8400-e29b-41d4-a716-446655440040';
const CUST_RECORD_B = '550e8400-e29b-41d4-a716-446655440041';
const DEALER_RECORD_A = '550e8400-e29b-41d4-a716-446655440042';
const DEALER_RECORD_B = '550e8400-e29b-41d4-a716-446655440043';
const VEHICLE_A = '550e8400-e29b-41d4-a716-446655440050';

const ORDER_A = '550e8400-e29b-41d4-a716-446655440020';
const ORDER_B = '550e8400-e29b-41d4-a716-446655440021';
const ORDER_UNASSIGNED = '550e8400-e29b-41d4-a716-446655440022';
const DOCUMENT_X = '550e8400-e29b-41d4-a716-446655440030';

const NIL_UUID = '00000000-0000-0000-0000-000000000000';

const h = vi.hoisted(() => {
  const selectQueue: { rows: unknown[] }[] = [];
  const svc = {
    getOrdersByCustomer: vi.fn(),
    getOrdersByDealer: vi.fn(),
    createOrder: vi.fn(),
    updateOrder: vi.fn(),
    changeOrderStatus: vi.fn(),
    getOrderDetail: vi.fn(),
    getOrderForEdit: vi.fn(),
    listOrders: vi.fn(),
    getOrderStats: vi.fn(),
    addNote: vi.fn(),
    addDocument: vi.fn(),
    deleteNote: vi.fn(),
    deleteDocument: vi.fn(),
    softDeleteOrder: vi.fn(),
    restoreOrder: vi.fn(),
    bulkUpdateStatus: vi.fn(),
    bulkDelete: vi.fn(),
    assignDealer: vi.fn(),
    createInvoice: vi.fn(),
  };
  return {
    selectQueue,
    pushSelect: (rows: unknown[]) => {
      selectQueue.push({ rows });
    },
    reset: () => {
      selectQueue.length = 0;
    },
    svc,
  };
});

vi.mock('@/lib/auth/session', () => ({
  requireAuth: vi.fn(),
  getSession: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/lib/auth/rbac', () => {
  const HIERARCHY = ['customer', 'dealer', 'admin', 'super_admin'];
  return {
    requirePermission: vi.fn().mockResolvedValue(undefined),
    requireRole: vi.fn(),
    requireMinRole: vi.fn(),
    hasRole: (ctx: { role: string }, ...roles: string[]) => roles.includes(ctx.role),
    hasMinRole: (ctx: { role: string }, min: string) =>
      HIERARCHY.indexOf(ctx.role) >= HIERARCHY.indexOf(min),
  };
});

vi.mock('@/server/db/client', () => {
  function select() {
    const chain = {
      from: () => chain,
      where: () => chain,
      limit: () => {
        const entry = h.selectQueue.shift();
        return Promise.resolve(entry ? entry.rows : []);
      },
    };
    return chain;
  }
  function insert() {
    const chain = {
      values: () => ({
        onConflictDoUpdate: () => ({
          returning: async () => [],
        }),
      }),
    };
    return chain;
  }
  return {
    db: { select, insert, execute: vi.fn().mockResolvedValue([]) },
  };
});

vi.mock('@/server/services', async () => {
  const orderMod =
    await vi.importActual<typeof import('@/server/services/orderService')>(
      '@/server/services/orderService',
    );
  return {
    OrderService: vi.fn().mockImplementation(function () {
      return h.svc;
    }),
    PaymentService: vi.fn().mockImplementation(function () {
      return { createInvoice: h.svc.createInvoice };
    }),
    CreateOrderSchema: orderMod.CreateOrderSchema,
  };
});

vi.mock('@/server/services/auditService', () => ({
  AuditService: vi.fn().mockImplementation(function () {
    return { logAction: vi.fn().mockResolvedValue(undefined) };
  }),
  auditService: { logAction: vi.fn().mockResolvedValue(undefined) },
}));

import { requireAuth } from '@/lib/auth/session';
import { GET as ordersGet, POST as ordersPost } from '@/app/api/v1/orders/route';
import { GET as orderDetailGet } from '@/app/api/v1/orders/[id]/route';
import { POST as orderStatusPost } from '@/app/api/v1/orders/[id]/status/route';
import { DELETE as orderItemsDelete } from '@/app/api/v1/orders/[id]/items/route';
import { PATCH as shippingOrderPatch } from '@/app/api/v1/shipping/orders/[orderId]/route';
import { POST as paymentForOrderPost } from '@/app/api/v1/payments/orders/[orderId]/route';
import { POST as paymentForUserPost } from '@/app/api/v1/payments/users/[userId]/route';
import {
  createOrder as createOrderAction,
  listOrdersForAdmin,
  getOrderDetail,
  updateOrder,
  changeOrderStatus,
  deleteOrderDocument,
  softDeleteOrder,
  bulkDeleteOrders,
  getOrderStats,
  exportOrdersCsv,
  assignDealerToOrderAction,
} from '@/server/actions/orderActions';

function authCtx(role: AuthContext['role'], userId: string): AuthContext {
  return {
    userId,
    email: `${userId}@test.local`,
    role,
    supabaseUser: {} as AuthContext['supabaseUser'],
  };
}

function jsonRequest(url: string, body?: unknown): Request {
  return new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function paramsCtx(params: Record<string, string>) {
  return { params: Promise.resolve(params) };
}

function orderRow(id: string, customerId: string | null, dealerId: string | null, status = 'pending') {
  return { id, customerId, dealerId, status };
}

const dummyContext = { params: Promise.resolve({}) };

beforeEach(() => {
  h.reset();
  vi.clearAllMocks();
  const svc = h.svc;
  svc.getOrdersByCustomer.mockResolvedValue([{ id: 'order-1' }]);
  svc.getOrdersByDealer.mockResolvedValue([{ id: 'order-2' }]);
  svc.createOrder.mockResolvedValue({ id: 'order-new' });
  svc.updateOrder.mockResolvedValue({ id: ORDER_A });
  svc.changeOrderStatus.mockResolvedValue({ id: ORDER_A });
  svc.getOrderDetail.mockResolvedValue({ id: ORDER_A });
  svc.listOrders.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } });
  svc.getOrderStats.mockResolvedValue({ totalOrders: 1 });
  svc.softDeleteOrder.mockResolvedValue({ id: ORDER_A });
  svc.bulkDelete.mockResolvedValue([]);
  svc.assignDealer.mockResolvedValue({ id: ORDER_A });
  svc.createInvoice.mockResolvedValue({ id: 'inv-1', invoiceNumber: 'INV-1' });
});

// ──────────────────────────────────────────────────────────────
// 1-4, 9 — GET /orders list scoping
// ──────────────────────────────────────────────────────────────

describe('GET /orders — list scoping', () => {
  it('1. customer A cannot read customer B orders via customerId', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('customer', USER_CUSTOMER_A));
    h.pushSelect([{ id: CUST_RECORD_A }]); // resolves caller's own record
    const res = await ordersGet(
      new Request(`http://localhost/api/v1/orders?customerId=${CUST_RECORD_B}`),
      dummyContext,
    );
    expect(res.status).toBe(401);
    expect((await res.json()).error.code).toBe('UNAUTHORIZED');
    expect(h.svc.getOrdersByCustomer).not.toHaveBeenCalled();
    expect(h.selectQueue).toHaveLength(0);
  });

  it('1b. customer A listing own orders works (valid path)', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('customer', USER_CUSTOMER_A));
    h.pushSelect([{ id: CUST_RECORD_A }]);
    const res = await ordersGet(
      new Request(`http://localhost/api/v1/orders?customerId=${CUST_RECORD_A}`),
      dummyContext,
    );
    expect(res.status).toBe(200);
    expect(h.svc.getOrdersByCustomer).toHaveBeenCalledWith(CUST_RECORD_A);
  });

  it('1c. customer A with no params reads own orders only', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('customer', USER_CUSTOMER_A));
    h.pushSelect([{ id: CUST_RECORD_A }]);
    const res = await ordersGet(new Request('http://localhost/api/v1/orders'), dummyContext);
    expect(res.status).toBe(200);
    expect(h.svc.getOrdersByCustomer).toHaveBeenCalledWith(CUST_RECORD_A);
  });

  it('1d. customer cannot use the dealerId filter', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('customer', USER_CUSTOMER_A));
    h.pushSelect([{ id: CUST_RECORD_A }]);
    const res = await ordersGet(
      new Request(`http://localhost/api/v1/orders?dealerId=${DEALER_RECORD_A}`),
      dummyContext,
    );
    expect(res.status).toBe(401);
    expect(h.svc.getOrdersByDealer).not.toHaveBeenCalled();
  });

  it('2. dealer A cannot read dealer B orders via dealerId', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('dealer', USER_DEALER_A));
    h.pushSelect([{ id: DEALER_RECORD_A }]);
    const res = await ordersGet(
      new Request(`http://localhost/api/v1/orders?dealerId=${DEALER_RECORD_B}`),
      dummyContext,
    );
    expect(res.status).toBe(401);
    expect((await res.json()).error.code).toBe('UNAUTHORIZED');
    expect(h.svc.getOrdersByDealer).not.toHaveBeenCalled();
    expect(h.selectQueue).toHaveLength(0);
  });

  it('2b. dealer A reading own dealer orders works (valid path)', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('dealer', USER_DEALER_A));
    h.pushSelect([{ id: DEALER_RECORD_A }]);
    const res = await ordersGet(
      new Request(`http://localhost/api/v1/orders?dealerId=${DEALER_RECORD_A}`),
      dummyContext,
    );
    expect(res.status).toBe(200);
    expect(h.svc.getOrdersByDealer).toHaveBeenCalledWith(DEALER_RECORD_A);
  });

  it('2c. dealer with no params keeps the existing empty result', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('dealer', USER_DEALER_A));
    const res = await ordersGet(new Request('http://localhost/api/v1/orders'), dummyContext);
    expect(res.status).toBe(200);
    expect((await res.json()).data).toEqual([]);
    expect(h.svc.getOrdersByDealer).not.toHaveBeenCalled();
    expect(h.svc.getOrdersByCustomer).not.toHaveBeenCalled();
  });

  it('3. dealer A cannot reach customer orders through customerId', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('dealer', USER_DEALER_A));
    const res = await ordersGet(
      new Request(`http://localhost/api/v1/orders?customerId=${CUST_RECORD_B}`),
      dummyContext,
    );
    expect(res.status).toBe(401);
    expect(h.svc.getOrdersByCustomer).not.toHaveBeenCalled();
    expect(h.selectQueue).toHaveLength(0);
  });

  it('4. admin customerId filter access remains', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('admin', USER_ADMIN));
    const res = await ordersGet(
      new Request(`http://localhost/api/v1/orders?customerId=${CUST_RECORD_B}`),
      dummyContext,
    );
    expect(res.status).toBe(200);
    expect(h.svc.getOrdersByCustomer).toHaveBeenCalledWith(CUST_RECORD_B);
  });

  it('4b. admin dealerId filter access remains', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('admin', USER_ADMIN));
    const res = await ordersGet(
      new Request(`http://localhost/api/v1/orders?dealerId=${DEALER_RECORD_B}`),
      dummyContext,
    );
    expect(res.status).toBe(200);
    expect(h.svc.getOrdersByDealer).toHaveBeenCalledWith(DEALER_RECORD_B);
  });

  it('4c. admin with no params keeps the existing empty result', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('admin', USER_ADMIN));
    const res = await ordersGet(new Request('http://localhost/api/v1/orders'), dummyContext);
    expect(res.status).toBe(200);
    expect((await res.json()).data).toEqual([]);
  });
});

// ──────────────────────────────────────────────────────────────
// 5-6 — POST /orders creation scoping
// ──────────────────────────────────────────────────────────────

describe('POST /orders — creation scoping', () => {
  it('5. customer cannot forge customerId (forced to own record)', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('customer', USER_CUSTOMER_A));
    h.pushSelect([{ id: CUST_RECORD_A }]);
    const res = await ordersPost(
      jsonRequest('http://localhost/api/v1/orders', {
        orderNumber: 'ORD-1',
        customerId: CUST_RECORD_B,
        status: 'pending',
      }),
      dummyContext,
    );
    expect(res.status).toBe(201);
    expect(h.svc.createOrder).toHaveBeenCalledTimes(1);
    const arg = h.svc.createOrder.mock.calls[0]![0];
    expect(arg.customerId).toBe(CUST_RECORD_A);
  });

  it('5b. dealer cannot forge dealerId (forced to own record)', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('dealer', USER_DEALER_A));
    h.pushSelect([{ id: DEALER_RECORD_A }]);
    const res = await ordersPost(
      jsonRequest('http://localhost/api/v1/orders', {
        orderNumber: 'ORD-2',
        dealerId: DEALER_RECORD_B,
        customerId: CUST_RECORD_B,
        status: 'pending',
      }),
      dummyContext,
    );
    expect(res.status).toBe(201);
    const arg = h.svc.createOrder.mock.calls[0]![0];
    expect(arg.dealerId).toBe(DEALER_RECORD_A);
    expect(arg.customerId).toBe(CUST_RECORD_B); // dealers legitimately sell to customers
  });

  it('6. customer cannot forge initial status (forced to pending)', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('customer', USER_CUSTOMER_A));
    h.pushSelect([{ id: CUST_RECORD_A }]);
    await ordersPost(
      jsonRequest('http://localhost/api/v1/orders', {
        orderNumber: 'ORD-3',
        status: 'delivered',
      }),
      dummyContext,
    );
    const arg = h.svc.createOrder.mock.calls[0]![0];
    expect(arg.status).toBe('pending');
  });

  it('6b. dealer cannot forge initial status (forced to pending)', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('dealer', USER_DEALER_A));
    h.pushSelect([{ id: DEALER_RECORD_A }]);
    await ordersPost(
      jsonRequest('http://localhost/api/v1/orders', {
        orderNumber: 'ORD-4',
        status: 'delivered',
      }),
      dummyContext,
    );
    const arg = h.svc.createOrder.mock.calls[0]![0];
    expect(arg.status).toBe('pending');
  });

  it('4d. admin keeps explicit ownership, status and totals (valid path)', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('admin', USER_ADMIN));
    const res = await ordersPost(
      jsonRequest('http://localhost/api/v1/orders', {
        orderNumber: 'ORD-5',
        customerId: CUST_RECORD_B,
        dealerId: DEALER_RECORD_B,
        status: 'delivered',
        totalAmount: 123456,
      }),
      dummyContext,
    );
    expect(res.status).toBe(201);
    const arg = h.svc.createOrder.mock.calls[0]![0];
    expect(arg.customerId).toBe(CUST_RECORD_B);
    expect(arg.dealerId).toBe(DEALER_RECORD_B);
    expect(arg.status).toBe('delivered');
    expect(arg.totalAmount).toBe(123456);
  });

  it('derives totalAmount from the vehicle price for non-admins', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('customer', USER_CUSTOMER_A));
    h.pushSelect([{ id: CUST_RECORD_A }]); // customer record
    h.pushSelect([{ price: 250000 }]); // vehicle price
    await ordersPost(
      jsonRequest('http://localhost/api/v1/orders', {
        orderNumber: 'ORD-6',
        vehicleId: VEHICLE_A,
        totalAmount: 999,
      }),
      dummyContext,
    );
    const arg = h.svc.createOrder.mock.calls[0]![0];
    expect(arg.totalAmount).toBe(250000);
    expect(h.selectQueue).toHaveLength(0);
  });

  it('customer without a profile cannot create orders', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('customer', USER_CUSTOMER_A));
    h.pushSelect([]); // no customer record
    const res = await ordersPost(
      jsonRequest('http://localhost/api/v1/orders', { orderNumber: 'ORD-7' }),
      dummyContext,
    );
    expect(res.status).toBe(401);
    expect(h.svc.createOrder).not.toHaveBeenCalled();
  });
});

// ──────────────────────────────────────────────────────────────
// 7 — payments URL identity
// ──────────────────────────────────────────────────────────────

describe('payments — URL identity is authoritative', () => {
  it('7. body orderId cannot override the URL orderId', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('admin', USER_ADMIN));
    h.pushSelect([orderRow(ORDER_A, CUST_RECORD_A, null)]);
    const res = await paymentForOrderPost(
      jsonRequest('http://localhost/api/v1/payments/orders/anything', {
        orderId: ORDER_B,
        subtotal: 500,
      }),
      paramsCtx({ orderId: ORDER_A }),
    );
    expect(res.status).toBe(201);
    const arg = h.svc.createInvoice.mock.calls[0]![0];
    expect(arg.orderId).toBe(ORDER_A);
    expect(arg.orderId).not.toBe(ORDER_B);
    expect(arg.subtotal).toBe(500);
  });

  it('non-UUID URL orderId is rejected before any write', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('admin', USER_ADMIN));
    const res = await paymentForOrderPost(
      jsonRequest('http://localhost/api/v1/payments/orders/x', { orderId: ORDER_B }),
      paramsCtx({ orderId: 'not-a-uuid' }),
    );
    expect(res.status).toBe(422);
    expect(h.svc.createInvoice).not.toHaveBeenCalled();
  });

  it('customer cannot invoice another customer order (URL order ownership)', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('customer', USER_CUSTOMER_A));
    h.pushSelect([orderRow(ORDER_B, CUST_RECORD_B, null)]);
    h.pushSelect([{ id: CUST_RECORD_A }]);
    const res = await paymentForOrderPost(
      jsonRequest('http://localhost/api/v1/payments/orders/x', { orderId: ORDER_A }),
      paramsCtx({ orderId: ORDER_B }),
    );
    expect(res.status).toBe(401);
    expect(h.svc.createInvoice).not.toHaveBeenCalled();
    expect(h.selectQueue).toHaveLength(0);
  });

  it('customer can invoice their own order (valid path)', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('customer', USER_CUSTOMER_A));
    h.pushSelect([orderRow(ORDER_A, CUST_RECORD_A, null)]);
    h.pushSelect([{ id: CUST_RECORD_A }]);
    const res = await paymentForOrderPost(
      jsonRequest('http://localhost/api/v1/payments/orders/x', {}),
      paramsCtx({ orderId: ORDER_A }),
    );
    expect(res.status).toBe(201);
    expect(h.svc.createInvoice.mock.calls[0]![0].orderId).toBe(ORDER_A);
  });

  it('unknown URL order returns 404 for admin', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('admin', USER_ADMIN));
    h.pushSelect([]);
    const res = await paymentForOrderPost(
      jsonRequest('http://localhost/api/v1/payments/orders/x', {}),
      paramsCtx({ orderId: ORDER_B }),
    );
    expect(res.status).toBe(404);
    expect(h.svc.createInvoice).not.toHaveBeenCalled();
  });

  it('users route: non-admin cannot act for another URL user', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('customer', USER_CUSTOMER_A));
    const res = await paymentForUserPost(
      jsonRequest('http://localhost/api/v1/payments/users/x', { orderId: ORDER_A }),
      paramsCtx({ userId: USER_UNRELATED }),
    );
    expect(res.status).toBe(401);
    expect(h.svc.createInvoice).not.toHaveBeenCalled();
    expect(h.selectQueue).toHaveLength(0);
  });

  it('users route: body userId cannot override the URL user scope', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('customer', USER_CUSTOMER_A));
    h.pushSelect([orderRow(ORDER_A, CUST_RECORD_A, null)]);
    h.pushSelect([{ id: CUST_RECORD_A }]);
    const res = await paymentForUserPost(
      jsonRequest('http://localhost/api/v1/payments/users/x', {
        userId: USER_UNRELATED,
        orderId: ORDER_A,
      }),
      paramsCtx({ userId: USER_CUSTOMER_A }),
    );
    expect(res.status).toBe(201);
    const arg = h.svc.createInvoice.mock.calls[0]![0];
    expect('userId' in arg).toBe(false); // URL/body userId is never stored
    expect(arg.orderId).toBe(ORDER_A);
  });

  it('users route: admin may act for any URL user (valid path)', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('admin', USER_ADMIN));
    h.pushSelect([orderRow(ORDER_A, CUST_RECORD_B, null)]);
    const res = await paymentForUserPost(
      jsonRequest('http://localhost/api/v1/payments/users/x', { orderId: ORDER_A }),
      paramsCtx({ userId: USER_CUSTOMER_B }),
    );
    expect(res.status).toBe(201);
    expect(h.svc.createInvoice.mock.calls[0]![0].orderId).toBe(ORDER_A);
  });
});

// ──────────────────────────────────────────────────────────────
// 8-9 — orderActions mutations
// ──────────────────────────────────────────────────────────────

describe('orderActions — ownership on read/mutation', () => {
  it('8. customer cannot update another customer order', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('customer', USER_CUSTOMER_A));
    h.pushSelect([orderRow(ORDER_B, CUST_RECORD_B, null)]);
    h.pushSelect([{ id: CUST_RECORD_A }]);
    const result = await updateOrder(ORDER_B, { totalAmount: 1 });
    expect(result.success).toBe(false);
    expect(result.success === false && result.code).toBe('UNAUTHORIZED');
    expect(h.svc.updateOrder).not.toHaveBeenCalled();
    expect(h.selectQueue).toHaveLength(0);
  });

  it('8b. dealer cannot reassign the dealer of their order', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('dealer', USER_DEALER_A));
    h.pushSelect([orderRow(ORDER_A, CUST_RECORD_B, DEALER_RECORD_A)]);
    h.pushSelect([{ id: DEALER_RECORD_A }]);
    const result = await updateOrder(ORDER_A, { dealerId: DEALER_RECORD_B });
    expect(result.success).toBe(false);
    expect(result.success === false && result.code).toBe('UNAUTHORIZED');
    expect(h.svc.updateOrder).not.toHaveBeenCalled();
  });

  it('8c. dealer cannot reassign the customer of their order', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('dealer', USER_DEALER_A));
    h.pushSelect([orderRow(ORDER_A, CUST_RECORD_B, DEALER_RECORD_A)]);
    h.pushSelect([{ id: DEALER_RECORD_A }]);
    const result = await updateOrder(ORDER_A, { customerId: USER_UNRELATED });
    expect(result.success).toBe(false);
    expect(h.svc.updateOrder).not.toHaveBeenCalled();
  });

  it('8d. status cannot bypass the transition validation (admin included)', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('admin', USER_ADMIN));
    h.pushSelect([orderRow(ORDER_A, CUST_RECORD_B, null, 'pending')]);
    const result = await updateOrder(ORDER_A, { status: 'delivered' });
    expect(result.success).toBe(false);
    expect(result.success === false && result.code).toBe('INVALID_ORDER_STATUS_TRANSITION');
    expect(h.svc.updateOrder).not.toHaveBeenCalled();
  });

  it('9. admin valid status transition still works', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('admin', USER_ADMIN));
    h.pushSelect([orderRow(ORDER_A, CUST_RECORD_B, null, 'pending')]);
    const result = await updateOrder(ORDER_A, { status: 'confirmed' });
    expect(result.success).toBe(true);
    expect(h.svc.updateOrder).toHaveBeenCalledWith(ORDER_A, expect.objectContaining({ status: 'confirmed' }));
  });

  it('9b. unchanged status edit keeps working (admin edit form path)', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('admin', USER_ADMIN));
    h.pushSelect([orderRow(ORDER_A, CUST_RECORD_B, null, 'pending')]);
    const result = await updateOrder(ORDER_A, { status: 'pending', totalAmount: 42 });
    expect(result.success).toBe(true);
    expect(h.svc.updateOrder).toHaveBeenCalled();
  });

  it('8e. customer cannot change the status of another customer order', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('customer', USER_CUSTOMER_A));
    h.pushSelect([orderRow(ORDER_B, CUST_RECORD_B, null)]);
    h.pushSelect([{ id: CUST_RECORD_A }]);
    const result = await changeOrderStatus(ORDER_B, 'cancelled');
    expect(result.success).toBe(false);
    expect(h.svc.changeOrderStatus).not.toHaveBeenCalled();
  });

  it('9c. customer can change the status of their own order (valid path)', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('customer', USER_CUSTOMER_A));
    h.pushSelect([orderRow(ORDER_A, CUST_RECORD_A, null, 'pending')]);
    h.pushSelect([{ id: CUST_RECORD_A }]);
    const result = await changeOrderStatus(ORDER_A, 'cancelled');
    expect(result.success).toBe(true);
    expect(h.svc.changeOrderStatus).toHaveBeenCalledWith(ORDER_A, 'cancelled', USER_CUSTOMER_A, undefined);
  });

  it('8f. customer cannot soft-delete another customer order', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('customer', USER_CUSTOMER_A));
    h.pushSelect([orderRow(ORDER_B, CUST_RECORD_B, null)]);
    h.pushSelect([{ id: CUST_RECORD_A }]);
    const result = await softDeleteOrder(ORDER_B);
    expect(result.success).toBe(false);
    expect(h.svc.softDeleteOrder).not.toHaveBeenCalled();
  });

  it('8g. cross-owner bulk delete fails before any mutation', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('customer', USER_CUSTOMER_A));
    h.pushSelect([orderRow(ORDER_A, CUST_RECORD_A, null)]); // assert #1: order
    h.pushSelect([{ id: CUST_RECORD_A }]); // assert #1: customer record
    h.pushSelect([orderRow(ORDER_B, CUST_RECORD_B, null)]); // assert #2: order
    h.pushSelect([{ id: CUST_RECORD_A }]); // assert #2: customer record
    const result = await bulkDeleteOrders([ORDER_A, ORDER_B]);
    expect(result.success).toBe(false);
    expect(result.success === false && result.code).toBe('UNAUTHORIZED');
    expect(h.svc.bulkDelete).not.toHaveBeenCalled();
    expect(h.selectQueue).toHaveLength(0);
  });

  it('8h. customer cannot delete a document attached to another order', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('customer', USER_CUSTOMER_A));
    h.pushSelect([{ orderId: ORDER_B }]); // document parent lookup
    h.pushSelect([orderRow(ORDER_B, CUST_RECORD_B, null)]);
    h.pushSelect([{ id: CUST_RECORD_A }]);
    const result = await deleteOrderDocument(DOCUMENT_X);
    expect(result.success).toBe(false);
    expect(h.svc.deleteDocument).not.toHaveBeenCalled();
  });

  it('9d. customer can delete a document on their own order (valid path)', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('customer', USER_CUSTOMER_A));
    h.pushSelect([{ orderId: ORDER_A }]);
    h.pushSelect([orderRow(ORDER_A, CUST_RECORD_A, null)]);
    h.pushSelect([{ id: CUST_RECORD_A }]);
    h.svc.deleteDocument.mockResolvedValue({ id: DOCUMENT_X });
    const result = await deleteOrderDocument(DOCUMENT_X);
    expect(result.success).toBe(true);
    expect(h.svc.deleteDocument).toHaveBeenCalledWith(DOCUMENT_X);
  });

  it('8i. dealer cannot steal an unassigned order via assignDealer', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('dealer', USER_DEALER_A));
    h.pushSelect([orderRow(ORDER_UNASSIGNED, CUST_RECORD_B, null)]);
    h.pushSelect([{ id: DEALER_RECORD_A }]);
    const result = await assignDealerToOrderAction(ORDER_UNASSIGNED, DEALER_RECORD_A);
    expect(result.success).toBe(false);
    expect(result.success === false && result.code).toBe('UNAUTHORIZED');
    expect(h.svc.assignDealer).not.toHaveBeenCalled();
  });

  it('9e. admin can assign a dealer (valid path)', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('admin', USER_ADMIN));
    h.pushSelect([orderRow(ORDER_UNASSIGNED, CUST_RECORD_B, null)]);
    const result = await assignDealerToOrderAction(ORDER_UNASSIGNED, DEALER_RECORD_A);
    expect(result.success).toBe(true);
    expect(h.svc.assignDealer).toHaveBeenCalledWith(ORDER_UNASSIGNED, DEALER_RECORD_A, USER_ADMIN);
  });
});

describe('orderActions — detail reads and list scoping', () => {
  it('8j. customer cannot read another customer order detail', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('customer', USER_CUSTOMER_A));
    h.pushSelect([orderRow(ORDER_B, CUST_RECORD_B, null)]);
    h.pushSelect([{ id: CUST_RECORD_A }]);
    const result = await getOrderDetail(ORDER_B);
    expect(result.success).toBe(false);
    expect(h.svc.getOrderDetail).not.toHaveBeenCalled();
  });

  it('9f. customer can read their own order detail (valid path)', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('customer', USER_CUSTOMER_A));
    h.pushSelect([orderRow(ORDER_A, CUST_RECORD_A, null)]);
    h.pushSelect([{ id: CUST_RECORD_A }]);
    const result = await getOrderDetail(ORDER_A);
    expect(result.success).toBe(true);
    expect(h.svc.getOrderDetail).toHaveBeenCalledWith(ORDER_A);
  });

  it('listOrdersForAdmin pins a customer to their own customerId filter', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('customer', USER_CUSTOMER_A));
    h.pushSelect([{ id: CUST_RECORD_A }]);
    const result = await listOrdersForAdmin({ customerId: CUST_RECORD_B });
    expect(result.success).toBe(true);
    expect(h.svc.listOrders).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: CUST_RECORD_A }),
    );
  });

  it('listOrdersForAdmin pins a dealer to their own dealerId filter', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('dealer', USER_DEALER_A));
    h.pushSelect([{ id: DEALER_RECORD_A }]);
    const result = await listOrdersForAdmin({ dealerId: DEALER_RECORD_B, customerId: CUST_RECORD_B });
    expect(result.success).toBe(true);
    const arg = h.svc.listOrders.mock.calls[0]![0];
    expect(arg.dealerId).toBe(DEALER_RECORD_A);
    expect(arg.customerId).toBe(CUST_RECORD_B); // narrows within own dealer scope
  });

  it('listOrdersForAdmin keeps admin params untouched', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('admin', USER_ADMIN));
    const result = await listOrdersForAdmin({ customerId: CUST_RECORD_B });
    expect(result.success).toBe(true);
    expect(h.svc.listOrders).toHaveBeenCalledWith(expect.objectContaining({ customerId: CUST_RECORD_B }));
    expect(h.selectQueue).toHaveLength(0);
  });

  it('customer without a profile is pinned to a nil filter (no unfiltered list)', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('customer', USER_CUSTOMER_A));
    h.pushSelect([]); // no customer record
    await listOrdersForAdmin({});
    expect(h.svc.listOrders).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: NIL_UUID }),
    );
  });

  it('global order statistics are denied to non-admins', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('customer', USER_CUSTOMER_A));
    const result = await getOrderStats();
    expect(result.success).toBe(false);
    expect(result.success === false && result.code).toBe('UNAUTHORIZED');
    expect(h.svc.getOrderStats).not.toHaveBeenCalled();
  });

  it('admin order statistics still work', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('admin', USER_ADMIN));
    const result = await getOrderStats();
    expect(result.success).toBe(true);
    expect(h.svc.getOrderStats).toHaveBeenCalled();
  });

  it('CSV export is scoped for customers', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('customer', USER_CUSTOMER_A));
    h.pushSelect([{ id: CUST_RECORD_A }]);
    const result = await exportOrdersCsv({ customerId: CUST_RECORD_B });
    expect(result.success).toBe(true);
    const arg = h.svc.listOrders.mock.calls[0]![0];
    expect(arg.customerId).toBe(CUST_RECORD_A);
    expect(arg.limit).toBe(10000);
  });
});

describe('orderActions — createOrder scoping', () => {
  it('5c. createOrder action cannot forge customerId/status', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('customer', USER_CUSTOMER_A));
    h.pushSelect([{ id: CUST_RECORD_A }]);
    const result = await createOrderAction({
      orderNumber: 'ORD-77',
      customerId: CUST_RECORD_B,
      status: 'delivered',
      totalAmount: 999,
    });
    expect(result.success).toBe(true);
    const arg = h.svc.createOrder.mock.calls[0]![0];
    expect(arg.customerId).toBe(CUST_RECORD_A);
    expect(arg.status).toBe('pending');
  });

  it('5d. createOrder action forces dealerId for dealers', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('dealer', USER_DEALER_A));
    h.pushSelect([{ id: DEALER_RECORD_A }]);
    const result = await createOrderAction({
      orderNumber: 'ORD-78',
      dealerId: DEALER_RECORD_B,
      customerId: CUST_RECORD_B,
      status: 'shipped',
      totalAmount: 1,
    });
    expect(result.success).toBe(true);
    const arg = h.svc.createOrder.mock.calls[0]![0];
    expect(arg.dealerId).toBe(DEALER_RECORD_A);
    expect(arg.status).toBe('pending');
  });

  it('4e. admin createOrder action keeps explicit fields', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('admin', USER_ADMIN));
    const result = await createOrderAction({
      orderNumber: 'ORD-79',
      customerId: CUST_RECORD_B,
      status: 'confirmed',
      totalAmount: 5000,
    });
    expect(result.success).toBe(true);
    const arg = h.svc.createOrder.mock.calls[0]![0];
    expect(arg.customerId).toBe(CUST_RECORD_B);
    expect(arg.status).toBe('confirmed');
    expect(arg.totalAmount).toBe(5000);
  });
});

// ──────────────────────────────────────────────────────────────
// 501 stub ownership scaffold (orders/[id], status, items, shipping)
// ──────────────────────────────────────────────────────────────

describe('501 stubs run the ownership scaffold', () => {
  it('orders/[id] GET: owner gets 501', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('customer', USER_CUSTOMER_A));
    h.pushSelect([orderRow(ORDER_A, CUST_RECORD_A, null)]);
    h.pushSelect([{ id: CUST_RECORD_A }]);
    const res = await orderDetailGet(new Request('http://x'), paramsCtx({ id: ORDER_A }));
    expect(res.status).toBe(501);
  });

  it('orders/[id] GET: foreign order gets 401 instead of a stub', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('customer', USER_CUSTOMER_A));
    h.pushSelect([orderRow(ORDER_B, CUST_RECORD_B, null)]);
    h.pushSelect([{ id: CUST_RECORD_A }]);
    const res = await orderDetailGet(new Request('http://x'), paramsCtx({ id: ORDER_B }));
    expect(res.status).toBe(401);
    expect(h.selectQueue).toHaveLength(0);
  });

  it('orders/[id] GET: unknown order gets 404 for admin', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('admin', USER_ADMIN));
    h.pushSelect([]);
    const res = await orderDetailGet(new Request('http://x'), paramsCtx({ id: ORDER_B }));
    expect(res.status).toBe(404);
  });

  it('orders/[id] GET: malformed id gets 422', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('admin', USER_ADMIN));
    const res = await orderDetailGet(new Request('http://x'), paramsCtx({ id: 'oops' }));
    expect(res.status).toBe(422);
    expect(h.selectQueue).toHaveLength(0);
  });

  it('orders/[id]/status POST: owner 501 / foreign 401', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('customer', USER_CUSTOMER_A));
    h.pushSelect([orderRow(ORDER_A, CUST_RECORD_A, null)]);
    h.pushSelect([{ id: CUST_RECORD_A }]);
    expect((await orderStatusPost(new Request('http://x'), paramsCtx({ id: ORDER_A }))).status).toBe(501);

    h.pushSelect([orderRow(ORDER_B, CUST_RECORD_B, null)]);
    h.pushSelect([{ id: CUST_RECORD_A }]);
    expect((await orderStatusPost(new Request('http://x'), paramsCtx({ id: ORDER_B }))).status).toBe(401);
    expect(h.selectQueue).toHaveLength(0);
  });

  it('orders/[id]/items DELETE: owner 501 / foreign 401', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('customer', USER_CUSTOMER_A));
    h.pushSelect([orderRow(ORDER_A, CUST_RECORD_A, null)]);
    h.pushSelect([{ id: CUST_RECORD_A }]);
    expect((await orderItemsDelete(new Request('http://x'), paramsCtx({ id: ORDER_A }))).status).toBe(501);

    h.pushSelect([orderRow(ORDER_B, CUST_RECORD_B, null)]);
    h.pushSelect([{ id: CUST_RECORD_A }]);
    expect((await orderItemsDelete(new Request('http://x'), paramsCtx({ id: ORDER_B }))).status).toBe(401);
    expect(h.selectQueue).toHaveLength(0);
  });

  it('shipping/orders/[orderId] PATCH: dealer owner 501 / foreign dealer 401', async () => {
    (requireAuth as Mock).mockResolvedValue(authCtx('dealer', USER_DEALER_A));
    h.pushSelect([orderRow(ORDER_A, CUST_RECORD_B, DEALER_RECORD_A)]);
    h.pushSelect([{ id: DEALER_RECORD_A }]);
    expect(
      (await shippingOrderPatch(new Request('http://x'), paramsCtx({ orderId: ORDER_A }))).status,
    ).toBe(501);

    h.pushSelect([orderRow(ORDER_B, CUST_RECORD_B, DEALER_RECORD_B)]);
    h.pushSelect([{ id: DEALER_RECORD_A }]);
    expect(
      (await shippingOrderPatch(new Request('http://x'), paramsCtx({ orderId: ORDER_B }))).status,
    ).toBe(401);
    expect(h.selectQueue).toHaveLength(0);
  });
});
