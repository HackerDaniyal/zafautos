import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/apiAuth';
import { assertOrderRouteAccess } from '@/lib/auth/orderAccess';

// H7 scaffold — every handler resolves and authorizes the URL order id via
// assertOrderRouteAccess before doing anything else. Implementations must keep
// this call (and run status changes through the transition validator) so future
// business logic cannot become an accidental IDOR endpoint.
export const GET = withAuth(async (_req, auth, context) => {
  await assertOrderRouteAccess(auth, context.params);
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
});

export const POST = withAuth(async (_req, auth, context) => {
  await assertOrderRouteAccess(auth, context.params);
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
});

export const DELETE = withAuth(async (_req, auth, context) => {
  await assertOrderRouteAccess(auth, context.params);
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
});
