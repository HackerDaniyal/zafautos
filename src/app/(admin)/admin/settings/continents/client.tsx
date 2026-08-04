'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Globe, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/admin/ui/empty-state';
import { ConfirmDialog } from '@/components/admin/dialogs/confirm-dialog';
import { FormField } from '@/components/admin/forms/form-field';
import { PageHeader } from '@/components/admin/ui/page-header';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  listContinentsWithCount,
  createContinent,
  updateContinent,
  deleteContinent,
  restoreContinent,
} from '@/server/actions/continentsActions';

interface Continent {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  displayOrder: number;
  countryCount: number;
  createdAt: string;
}

function ContinentsClient() {
  const [items, setItems] = useState<Continent[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Continent | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', displayOrder: 0, isActive: true });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Continent | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listContinentsWithCount();
      if (result.success) {
        const data = (result.data as Continent[]).sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
        setItems(data);
      } else {
        setFeedback({ type: 'error', message: result.error ?? 'Failed to load' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to load' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  function openCreate() {
    setEditing(null);
    setForm({ name: '', slug: '', displayOrder: items.length, isActive: true });
    setDialogOpen(true);
  }

  function openEdit(item: Continent) {
    setEditing(item);
    setForm({ name: item.name, slug: item.slug, displayOrder: item.displayOrder ?? 0, isActive: item.isActive ?? true });
    setDialogOpen(true);
  }

  function autoSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setFeedback({ type: 'error', message: 'Name is required' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || autoSlug(form.name.trim()),
        displayOrder: form.displayOrder,
        isActive: form.isActive,
      };
      const result = editing
        ? await updateContinent(editing.id, payload)
        : await createContinent(payload);
      if (result.success) {
        setFeedback({ type: 'success', message: editing ? 'Continent updated' : 'Continent created' });
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
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const result = await deleteContinent(deleteTarget.id);
      if (result.success) {
        setFeedback({ type: 'success', message: 'Continent deleted' });
        setDeleteTarget(null);
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

  async function handleRestore(item: Continent) {
    try {
      const result = await restoreContinent(item.id);
      if (result.success) {
        setFeedback({ type: 'success', message: `${item.name} restored` });
        await fetchData();
      } else {
        setFeedback({ type: 'error', message: result.error ?? 'Failed to restore' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to restore' });
    }
  }

  const filtered = items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <PageHeader title="Continents" description="Manage continents for country grouping">
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-1 size-4" />
          Add Continent
        </Button>
      </PageHeader>

      {feedback && (
        <div className={`rounded-[6px] px-4 py-3 text-sm ${feedback.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-signal-red/10 text-signal-red border border-signal-red/30'}`}>
          {feedback.message}
        </div>
      )}

      <div className="rounded-[10px] border border-iron/30 bg-carbon">
        <div className="border-b border-iron/30 p-4">
          <Input
            placeholder="Search continents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-deep-carbon border-iron/30 text-pure-white max-w-sm"
          />
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block size-6 animate-spin rounded-full border-2 border-iron border-t-signal-red" />
            <p className="mt-2 text-sm text-steel">Loading continents...</p>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No continents"
            description={search ? 'No continents match your search.' : 'No continents found. Add your first continent.'}
            icon={Globe}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-iron/30 text-left text-xs font-medium uppercase tracking-wider text-steel">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3 text-center">Countries</th>
                  <th className="px-4 py-3">Active</th>
                  <th className="px-4 py-3">Sort</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-iron/30">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-deep-carbon/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-pure-white">{item.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-steel">{item.slug}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center rounded-full bg-deep-carbon px-2 py-0.5 text-xs font-medium text-pure-white">
                        {item.countryCount ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${item.isActive ? 'bg-green-500/10 text-green-400' : 'bg-iron/30 text-steel'}`}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-steel">{item.displayOrder ?? 0}</td>
                    <td className="px-4 py-3 text-xs text-steel">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon-xs" onClick={() => openEdit(item)}>
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-xs" onClick={() => handleRestore(item)} title="Restore">
                          <RotateCcw className="size-3.5 text-green-400" />
                        </Button>
                        <Button variant="ghost" size="icon-xs" onClick={() => setDeleteTarget(item)}>
                          <Trash2 className="size-3.5 text-signal-red" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-carbon border-iron">
          <DialogHeader>
            <DialogTitle className="text-pure-white">
              {editing ? 'Edit Continent' : 'New Continent'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <FormField name="name" label="Name" required>
              <Input
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({ ...f, name, slug: autoSlug(name) }));
                }}
                placeholder="e.g. Asia, Europe, Africa"
                className="bg-deep-carbon border-iron/30 text-pure-white"
              />
            </FormField>
            <FormField name="slug" label="Slug">
              <Input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="auto-generated-from-name"
                className="bg-deep-carbon border-iron/30 text-pure-white"
              />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField name="displayOrder" label="Display Order">
                <Input
                  type="number"
                  value={form.displayOrder}
                  onChange={(e) => setForm((f) => ({ ...f, displayOrder: parseInt(e.target.value) || 0 }))}
                  className="bg-deep-carbon border-iron/30 text-pure-white"
                />
              </FormField>
              <FormField name="isActive" label="Active">
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${form.isActive ? 'bg-signal-red' : 'bg-iron/50'}`}
                  >
                    <span className={`pointer-events-none inline-block size-5 rounded-full bg-white shadow-lg transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                  <span className="text-sm text-ash">{form.isActive ? 'Active' : 'Inactive'}</span>
                </div>
              </FormField>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Delete Continent"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? Countries referencing this continent will have their continent field cleared.`}
        variant="destructive"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}

export { ContinentsClient };
