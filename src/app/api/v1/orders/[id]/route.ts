import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/apiAuth';

export const GET = withAuth(async () => {
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
});

export const POST = withAuth(async () => {
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
});

export const DELETE = withAuth(async () => {
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
});
