import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const SRC = path.resolve(__dirname, '../../../src');

function readRoute(relPath: string): string {
  return fs.readFileSync(path.join(SRC, relPath), 'utf-8');
}

function routeExists(relPath: string): boolean {
  return fs.existsSync(path.join(SRC, relPath));
}

describe('API Route Security — Authentication', () => {
  const protectedRoutes = [
    'app/api/v1/orders/route.ts',
    'app/api/v1/orders/[id]/route.ts',
    'app/api/v1/orders/[id]/items/route.ts',
    'app/api/v1/orders/[id]/status/route.ts',
    'app/api/v1/payments/route.ts',
    'app/api/v1/payments/invoices/route.ts',
    'app/api/v1/payments/orders/[orderId]/route.ts',
    'app/api/v1/payments/users/[userId]/route.ts',
    'app/api/v1/payments/[id]/status/route.ts',
    'app/api/v1/customers/profile/route.ts',
    'app/api/v1/customers/settings/route.ts',
    'app/api/v1/customers/addresses/route.ts',
    'app/api/v1/customers/alerts/route.ts',
    'app/api/v1/dealers/profile/route.ts',
    'app/api/v1/dealers/activity/route.ts',
    'app/api/v1/dealers/assignments/route.ts',
    'app/api/v1/documents/route.ts',
    'app/api/v1/documents/vehicles/[vehicleId]/route.ts',
    'app/api/v1/documents/[id]/versions/route.ts',
    'app/api/v1/shipping/route.ts',
    'app/api/v1/shipping/orders/[orderId]/route.ts',
    'app/api/v1/shipping/[id]/containers/route.ts',
    'app/api/v1/shipping/[id]/tracking/route.ts',
    'app/api/v1/vehicles/[id]/route.ts',
    'app/api/v1/marketplace/wishlist/route.ts',
    'app/api/v1/marketplace/compare/route.ts',
    'app/api/v1/marketplace/views/route.ts',
    'app/api/v1/auth/permissions/route.ts',
  ];

  const publicRoutes = [
    'app/api/v1/shipping/ports/route.ts',
    'app/api/v1/marketplace/featured/route.ts',
    'app/api/v1/marketplace/enquiries/route.ts',
    'app/api/v1/public/track/route.ts',
    'app/api/search/suggestions/route.ts',
    'app/api/v1/analytics/events/route.ts',
    'app/api/v1/analytics/search/route.ts',
    'app/api/v1/analytics/views/route.ts',
  ];

  describe('Protected routes use withAuth', () => {
    for (const route of protectedRoutes) {
      it(`${route} imports withAuth`, () => {
        expect(routeExists(route)).toBe(true);
        const source = readRoute(route);
        expect(source).toContain("from '@/lib/api/apiAuth'");
      });

      it(`${route} exports use withAuth wrapper`, () => {
        const source = readRoute(route);
        expect(source).toMatch(/withAuth\s*\(/);
      });
    }
  });

  describe('Public routes do NOT use withAuth', () => {
    for (const route of publicRoutes) {
      it(`${route} exists and exports HTTP handlers without withAuth`, () => {
        expect(routeExists(route)).toBe(true);
        const source = readRoute(route);
        expect(source).not.toContain('withAuth(');
        expect(source).toMatch(/export\s+(const|async\s+function)\s+(GET|POST|PUT|DELETE|PATCH)/);
      });
    }
  });

  describe('Vehicles GET allows public browsing', () => {
    it('app/api/v1/vehicles/route.ts exports GET without requiring auth', () => {
      const source = readRoute('app/api/v1/vehicles/route.ts');
      expect(source).toMatch(/export\s+const\s+GET/);
      expect(source).toContain('getOptionalAuth');
    });

    it('app/api/v1/vehicles/route.ts POST requires auth', () => {
      const source = readRoute('app/api/v1/vehicles/route.ts');
      expect(source).toMatch(/export\s+const\s+POST.*withAuth/);
    });
  });

  describe('apiAuth helper', () => {
    it('exports withAuth function', () => {
      const source = readRoute('lib/api/apiAuth.ts');
      expect(source).toContain('export function withAuth');
    });

    it('exports getOptionalAuth function', () => {
      const source = readRoute('lib/api/apiAuth.ts');
      expect(source).toContain('export async function getOptionalAuth');
    });

    it('uses requireAuth from session module', () => {
      const source = readRoute('lib/api/apiAuth.ts');
      expect(source).toContain("from '@/lib/auth/session'");
    });

    it('uses requireRole from rbac module', () => {
      const source = readRoute('lib/api/apiAuth.ts');
      expect(source).toContain("from '@/lib/auth/rbac'");
    });
  });
});

describe('API Route Security — IDOR Protection', () => {
  describe('Customer profile', () => {
    it('customers/profile checks ownership for customer role', () => {
      const source = readRoute('app/api/v1/customers/profile/route.ts');
      expect(source).toContain('hasMinRole');
      expect(source).toContain('auth.userId !== userId');
    });
  });

  describe('Customer settings', () => {
    it('customers/settings checks ownership for customer role', () => {
      const source = readRoute('app/api/v1/customers/settings/route.ts');
      expect(source).toContain("auth.role === 'customer'");
    });
  });

  describe('Customer addresses', () => {
    it('customers/addresses GET checks ownership', () => {
      const source = readRoute('app/api/v1/customers/addresses/route.ts');
      expect(source).toContain("auth.role === 'customer'");
    });

    it('customers/addresses POST scopes to authenticated customer', () => {
      const source = readRoute('app/api/v1/customers/addresses/route.ts');
      expect(source).toContain('auth.userId');
    });
  });

  describe('Wishlist', () => {
    it('wishlist GET requires matching userId', () => {
      const source = readRoute('app/api/v1/marketplace/wishlist/route.ts');
      expect(source).toContain('auth.userId !== userId');
    });

    it('wishlist POST uses auth.userId instead of client userId', () => {
      const source = readRoute('app/api/v1/marketplace/wishlist/route.ts');
      expect(source).toContain('auth.userId, vehicleId');
    });

    it('wishlist DELETE uses auth.userId', () => {
      const source = readRoute('app/api/v1/marketplace/wishlist/route.ts');
      expect(source).toContain('auth.userId, vehicleId');
    });
  });

  describe('Dealer profile', () => {
    it('dealers/profile checks ownership for dealer role', () => {
      const source = readRoute('app/api/v1/dealers/profile/route.ts');
      expect(source).toContain('hasMinRole');
      expect(source).toContain('auth.userId !== userId');
    });
  });

  describe('Dealer assignments', () => {
    it('dealers/assignments GET checks ownership for dealer role', () => {
      const source = readRoute('app/api/v1/dealers/assignments/route.ts');
      expect(source).toContain("auth.role === 'dealer'");
    });
  });

  describe('Orders', () => {
    it('orders GET checks customer ownership', () => {
      const source = readRoute('app/api/v1/orders/route.ts');
      expect(source).toContain("auth.role === 'customer'");
    });
  });
});

describe('API Route Security — Permission Requirements', () => {
  it('payments POST requires payments.create', () => {
    const source = readRoute('app/api/v1/payments/route.ts');
    expect(source).toContain("permission: 'payments.create'");
  });

  it('payments/invoices POST requires payments.create', () => {
    const source = readRoute('app/api/v1/payments/invoices/route.ts');
    expect(source).toContain("permission: 'payments.create'");
  });

  it('documents POST requires documents.create', () => {
    const source = readRoute('app/api/v1/documents/route.ts');
    expect(source).toContain("permission: 'documents.create'");
  });

  it('shipping POST requires shipping.create', () => {
    const source = readRoute('app/api/v1/shipping/route.ts');
    expect(source).toContain("permission: 'shipping.create'");
  });

  it('vehicles POST requires vehicles.create', () => {
    const source = readRoute('app/api/v1/vehicles/route.ts');
    expect(source).toContain("permission: 'vehicles.create'");
  });

  it('auth/permissions GET requires admin role', () => {
    const source = readRoute('app/api/v1/auth/permissions/route.ts');
    expect(source).toContain("roles: ['admin', 'super_admin']");
  });

  it('orders GET requires orders.read', () => {
    const source = readRoute('app/api/v1/orders/route.ts');
    expect(source).toContain("permission: 'orders.read'");
  });

  it('orders POST requires orders.create', () => {
    const source = readRoute('app/api/v1/orders/route.ts');
    expect(source).toContain("permission: 'orders.create'");
  });

  it('dealers/activity POST requires dealer role', () => {
    const source = readRoute('app/api/v1/dealers/activity/route.ts');
    expect(source).toContain("roles: ['dealer', 'admin', 'super_admin']");
  });
});
