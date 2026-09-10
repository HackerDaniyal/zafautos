'use client';

import Link from 'next/link';
import { useState } from 'react';
import { sendMessage } from '@/server/actions/accountActions';
import { Button } from '@/components/ui/button';

export function ThreadDetailClient({ thread }: { thread: any }) {
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState(thread.messages);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim() || sending) return;
    setSending(true);
    try {
      await sendMessage({
        threadId: thread.id,
        recipientId: messages[0]?.senderId || '',
        content: reply.trim(),
      });
      setMessages([...messages, {
        id: 'temp-' + Date.now(),
        content: reply.trim(),
        isRead: true,
        createdAt: new Date().toISOString(),
        senderId: 'current',
        senderEmail: null,
        senderFirstName: 'You',
        senderLastName: null,
      }]);
      setReply('');
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <Link href="/account/messages" className="text-sm text-steel hover:text-pure-white transition-colors">
        &larr; Back to messages
      </Link>
      <h1 className="mt-3 text-xl font-bold text-pure-white">{thread.subject || 'Message'}</h1>

      <div className="mt-6 space-y-4">
        {messages.map((m: any) => {
          const isMe = m.senderId === 'current';
          return (
            <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-[10px] p-4 ${
                isMe ? 'bg-signal-red/10 border border-signal-red/20' : 'bg-deep-carbon border border-iron/10'
              }`}>
                <p className="text-xs font-medium text-steel mb-1">
                  {isMe ? 'You' : (m.senderFirstName ? `${m.senderFirstName} ${m.senderLastName || ''}`.trim() : 'Support')}
                </p>
                <p className="text-sm text-pure-white whitespace-pre-wrap">{m.content}</p>
                <p className="mt-2 text-[10px] text-steel">{new Date(m.createdAt).toLocaleString()}</p>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSend} className="mt-6 flex gap-3">
        <input
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Type a reply..."
          className="flex-1 rounded-[6px] border border-iron/30 bg-deep-carbon px-4 py-3 text-sm text-pure-white placeholder:text-steel focus:outline-none focus:ring-1 focus:ring-signal-red"
        />
        <Button type="submit" disabled={!reply.trim() || sending}>
          {sending ? 'Sending...' : 'Send'}
        </Button>
      </form>
    </div>
  );
}
