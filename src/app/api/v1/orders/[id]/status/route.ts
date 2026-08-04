import { NextResponse } from 'next/server';

export async function GET(_req: Request, _ctx: { params: Promise<{ id: string }> }) {
  // TODO: Implement order status updates. Currently a copy-paste placeholder.
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}

export async function POST(_req: Request, _ctx: { params: Promise<{ id: string }> }) {
  // TODO: Implement order status updates. Currently a copy-paste placeholder.
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}

export async function DELETE(_req: Request, _ctx: { params: Promise<{ id: string }> }) {
  // TODO: Implement order status updates. Currently a copy-paste placeholder.
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
