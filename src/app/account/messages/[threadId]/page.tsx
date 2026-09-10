import { notFound } from 'next/navigation';
import { getMyThreadDetail } from '@/server/actions/accountActions';
import { ThreadDetailClient } from './client';

export const metadata = { title: 'Message Thread | ZafAutos Japan' };

export default async function ThreadDetailPage({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params;
  const thread = await getMyThreadDetail(threadId);
  if (!thread) notFound();

  return <ThreadDetailClient thread={thread} />;
}
