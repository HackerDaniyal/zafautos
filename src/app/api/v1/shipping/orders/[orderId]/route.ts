import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/apiAuth';
import { assertOrderRouteAccess } from '@/lib/auth/orderAccess';

// H7 scaffold — the URL order id is resolved and authorized via
// assertOrderRouteAccess before doing anything else. Implementations must keep
// this call so future business logic cannot become an accidental IDOR endpoint.
export const PATCH = withAuth(async (_req, auth, context) => {
  await assertOrderRouteAccess(auth, context.params, 'orderId');
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
});
