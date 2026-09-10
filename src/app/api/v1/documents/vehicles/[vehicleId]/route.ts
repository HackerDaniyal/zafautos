import { NextResponse } from 'next/server';

export async function GET(_req: Request, _ctx: { params: Promise<{ vehicleId: string }> }) {
  // TODO: Implement vehicle document listing. Currently a copy-paste placeholder.
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
