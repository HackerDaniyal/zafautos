'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function MessagesClient({ threads }: { threads: any[] }) {
  if (threads.length === 0) {
    return (
      <div className="rounded-[10px] border border-iron/10 bg-deep-carbon p-12 text-center">
        <svg className="mx-auto h-12 w-12 text-steel" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        <p className="mt-4 text-sm text-steel">No messages yet</p>
        <p className="text-xs text-steel mt-1">Messages from support will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {threads.map((thread) => (
        <Link
          key={thread.id}
          href={`/account/messages/${thread.id}`}
          className="block rounded-[10px] border border-iron/10 bg-deep-carbon p-4 hover:border-iron/25 transition-colors"
        >
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-pure-white truncate">{thread.subject || 'Message'}</p>
                {thread.unreadCount > 0 && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-signal-red px-1.5 text-[10px] font-bold text-pure-white">
                    {thread.unreadCount}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-steel truncate">{thread.lastMessage}</p>
            </div>
            <p className="text-xs text-steel shrink-0">
              {thread.lastMessageAt && new Date(thread.lastMessageAt).toLocaleDateString()}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
