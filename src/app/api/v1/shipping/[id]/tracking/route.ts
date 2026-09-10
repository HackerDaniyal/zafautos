import { NextResponse } from 'next/server';

export async function PATCH(_req: Request, _ctx: { params: Promise<{ id: string }> }) {
  // TODO: Implement shipment tracking events. Currently a copy-paste placeholder.
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
