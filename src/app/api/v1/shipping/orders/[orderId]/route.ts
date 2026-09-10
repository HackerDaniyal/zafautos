import { NextResponse } from 'next/server';

export async function PATCH(_req: Request, _ctx: { params: Promise<{ orderId: string }> }) {
  // TODO: Implement order-shipment association lookup. Currently a copy-paste placeholder.
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
