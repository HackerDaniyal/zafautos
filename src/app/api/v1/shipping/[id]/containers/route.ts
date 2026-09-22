import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/apiAuth';

export const PATCH = withAuth(async () => {
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
});
