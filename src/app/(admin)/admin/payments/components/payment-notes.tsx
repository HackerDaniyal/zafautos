'use client';

import { useState } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/admin/ui/empty-state';
import { useToast } from '@/components/admin/ui/use-toast';
import { addPaymentNote, deletePaymentNote } from '@/server/actions/paymentActions';
import type { PaymentHistoryRecord } from '../types';

interface PaymentNotesProps {
  paymentId: string;
  notes: PaymentHistoryRecord[];
  onNotesChanged: () => void;
}

export function PaymentNotes({ paymentId, notes, onNotesChanged }: PaymentNotesProps) {
  const { toast } = useToast();
  const [newNote, setNewNote] = useState('');
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleAddNote() {
    if (!newNote.trim()) return;
    setAdding(true);
    try {
      const result = await addPaymentNote(paymentId, newNote.trim());
      if (result.success) {
        toast({ title: 'Note added', variant: 'success' });
        setNewNote('');
        onNotesChanged();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'error' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to add note', variant: 'error' });
    } finally {
      setAdding(false);
    }
  }

  async function handleDeleteNote(noteId: string) {
    setDeletingId(noteId);
    try {
      const result = await deletePaymentNote(noteId);
      if (result.success) {
        toast({ title: 'Note deleted', variant: 'success' });
        onNotesChanged();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'error' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete note', variant: 'error' });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add a note..."
          className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white placeholder:text-steel focus:outline-none focus:ring-1 focus:ring-signal-red"
          rows={3}
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            disabled={adding || !newNote.trim()}
            onClick={handleAddNote}
          >
            <Plus className="mr-1 size-4" />
            {adding ? 'Adding...' : 'Add Note'}
          </Button>
        </div>
      </div>

      {notes.length === 0 ? (
        <EmptyState
          title="No notes"
          description="No notes have been added to this payment yet."
        />
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className="rounded-[6px] border border-iron/30 bg-deep-carbon p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-pure-white whitespace-pre-wrap">{note.note}</p>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={deletingId === note.id}
                  onClick={() => handleDeleteNote(note.id)}
                  className="shrink-0"
                >
                  <Trash2 className="size-3.5 text-signal-red" />
                </Button>
              </div>
              <p className="mt-2 text-xs text-steel">
                {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}