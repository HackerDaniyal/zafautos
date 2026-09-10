import { notFound } from 'next/navigation';
import { getMySupportTicketDetail } from '@/server/actions/supportActions';
import { TicketDetailClient } from './client';

export const metadata = { title: 'Support Ticket | ZafAutos Japan' };

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ticket = await getMySupportTicketDetail(id);
  if (!ticket) notFound();

  return <TicketDetailClient ticket={ticket} />;
}
