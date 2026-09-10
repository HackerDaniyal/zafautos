import { getMyMessageThreads } from '@/server/actions/accountActions';
import { MessagesClient } from './client';

export const metadata = { title: 'Messages | ZafAutos Japan' };

export default async function MessagesPage() {
  const threads = await getMyMessageThreads();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-pure-white">Messages</h1>
        <p className="text-sm text-steel mt-1">Conversations with ZafAutos support</p>
      </div>
      <MessagesClient threads={threads} />
    </div>
  );
}
