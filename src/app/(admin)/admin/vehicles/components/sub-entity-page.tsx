'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/admin/ui/empty-state';
import { ConfirmDialog } from '@/components/admin/dialogs/confirm-dialog';
import { FormField } from '@/components/admin/forms/form-field';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface SubEntity {
  id: string;
  name: string;
  slug?: string | null;
  createdAt: string;
}

interface ActionResultLike {
  success: boolean;
  data?: unknown;
  error?: string;
}

interface SubEntityPageProps {
  title: string;
  description: string;
  addActionLabel: string;
  listAction: () => Promise<ActionResultLike>;
  createAction: (data: { name: string; slug?: string }) => Promise<ActionResultLike>;
  updateAction: (id: string, data: { name: string }) => Promise<ActionResultLike>;
  deleteAction: (id: string) => Promise<ActionResultLike>;
}

export function SubEntityPage({
  title,
  description,
  addActionLabel,
  listAction,
  createAction,
  updateAction,
  deleteAction,
}: SubEntityPageProps) {
  const [items, setItems] = useState<SubEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SubEntity | null>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<SubEntity | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listAction();
      if (result.success) {
        setItems(result.data as SubEntity[]);
      } else {
        setFeedback({ type: 'error', message: result.error ?? 'Failed to load data' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  }, [listAction]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  function openCreate() {
    setEditingItem(null);
    setName('');
    setDialogOpen(true);
  }

  function openEdit(item: SubEntity) {
    setEditingItem(item);
    setName(item.name);
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!name.trim()) {
      setFeedback({ type: 'error', message: 'Name is required' });
      return;
    }
    setSaving(true);
    try {
      let result;
      if (editingItem) {
        result = await updateAction(editingItem.id, { name: name.trim() });
      } else {
        result = await createAction({ name: name.trim() });
      }
      if (result.success) {
        setFeedback({ type: 'success', message: editingItem ? 'Updated successfully' : 'Created successfully' });
        setDialogOpen(false);
        await fetchData();
      } else {
        setFeedback({ type: 'error', message: result.error ?? 'Failed to save' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to save' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteDialog) return;
    setDeleting(true);
    try {
      const result = await deleteAction(deleteDialog.id);
      if (result.success) {
        setFeedback({ type: 'success', message: 'Deleted successfully' });
        setDeleteDialog(null);
        await fetchData();
      } else {
        setFeedback({ type: 'error', message: result.error ?? 'Failed to delete' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to delete' });
    } finally {
      setDeleting(false);
    }
  }

  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-pure-white font-[Oswald] uppercase tracking-wide">
            {title}
          </h1>
          <p className="text-sm text-ash">{description}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1 size-4" />
            {addActionLabel}
          </Button>
        </div>
      </div>

      {feedback && (
        <div className={`rounded-[6px] px-4 py-3 text-sm ${feedback.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-signal-red/10 text-signal-red border border-signal-red/30'}`}>
          {feedback.message}
        </div>
      )}

      <div className="rounded-[10px] border border-iron/30 bg-carbon">
        <div className="flex items-center gap-3 border-b border-iron/30 p-4">
          <div className="flex-1">
            <Input
              placeholder={`Search ${title.toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-deep-carbon border-iron/30 text-pure-white"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <p className="text-steel">Loading...</p>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={`No ${title.toLowerCase()}`}
            description={search ? 'No items match your search.' : `No ${title.toLowerCase()} found. Create your first one.`}
          />
        ) : (
          <div className="divide-y divide-iron/30">
            {filtered.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-4 py-3 hover:bg-deep-carbon/50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-pure-white">{item.name}</p>
                  {item.slug && <p className="text-xs text-steel font-mono">{item.slug}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon-xs" onClick={() => openEdit(item)}>
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon-xs" onClick={() => setDeleteDialog(item)}>
                    <Trash2 className="size-3.5 text-signal-red" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-carbon border-iron">
          <DialogHeader>
            <DialogTitle className="text-pure-white">
              {editingItem ? `Edit ${title.slice(0, -1)}` : `New ${title.slice(0, -1)}`}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <FormField name="name" label="Name" required>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`Enter ${title.slice(0, -1).toLowerCase()} name`}
                className="bg-deep-carbon border-iron/30 text-pure-white"
                onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
              />
            </FormField>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !name.trim()}>
              {saving ? 'Saving...' : editingItem ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteDialog}
        onOpenChange={() => setDeleteDialog(null)}
        title={`Delete ${title.slice(0, -1)}`}
        description={`Are you sure you want to delete "${deleteDialog?.name}"? This action cannot be undone.`}
        variant="destructive"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
