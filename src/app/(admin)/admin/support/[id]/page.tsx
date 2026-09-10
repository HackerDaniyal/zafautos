import { notFound } from 'next/navigation';
import { getSupportTicketDetailAdmin } from '@/server/actions/supportActions';
import { AdminTicketDetailClient } from './client';

export const metadata = { title: 'Support Ticket | ZafAutos Admin' };

export default async function AdminTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ticket = await getSupportTicketDetailAdmin(id);
  if (!ticket) notFound();

  return <AdminTicketDetailClient ticket={ticket} />;
}
