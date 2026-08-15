'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Percent, RotateCcw } from 'lucide-react';
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
  listTaxRates,
  createTaxRate,
  updateTaxRate,
  deleteTaxRate,
  restoreTaxRate,
} from '@/server/actions/taxActions';

interface TaxRate {
  id: string;
  name: string;
  countryId: string | null;
  rate: string;
  type: 'percentage' | 'fixed';
  isDefault: boolean;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  countryName: string | null;
}

const defaultForm = {
  name: '', countryId: '', rate: 10, type: 'percentage' as 'percentage' | 'fixed',
  isDefault: false, displayOrder: 0, isActive: true,
};

function TaxClient() {
  const [items, setItems] = useState<TaxRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TaxRate | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TaxRate | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listTaxRates();
      if (result.success) {
        const data = (result.data as TaxRate[]).sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
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
    setForm({ ...defaultForm, displayOrder: items.length });
    setDialogOpen(true);
  }

  function openEdit(item: TaxRate) {
    setEditing(item);
    setForm({
      name: item.name,
      countryId: item.countryId ?? '',
      rate: parseFloat(item.rate) || 0,
      type: item.type ?? 'percentage',
      isDefault: item.isDefault ?? false,
      displayOrder: item.displayOrder ?? 0,
      isActive: item.isActive ?? true,
    });
    setDialogOpen(true);
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
        countryId: form.countryId.trim() || undefined,
        rate: form.rate,
        type: form.type,
        isDefault: form.isDefault,
        displayOrder: form.displayOrder,
        isActive: form.isActive,
      };
      const result = editing
        ? await updateTaxRate(editing.id, payload)
        : await createTaxRate(payload);
      if (result.success) {
        setFeedback({ type: 'success', message: editing ? 'Tax rate updated' : 'Tax rate created' });
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
      const result = await deleteTaxRate(deleteTarget.id);
      if (result.success) {
        setFeedback({ type: 'success', message: 'Tax rate deleted' });
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

  async function handleRestore(item: TaxRate) {
    try {
      const result = await restoreTaxRate(item.id);
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
      <PageHeader title="Tax Rates" description="Manage tax rates for orders and invoices">
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-1 size-4" />
          Add Tax Rate
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
            placeholder="Search tax rates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-deep-carbon border-iron/30 text-pure-white max-w-sm"
          />
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block size-6 animate-spin rounded-full border-2 border-iron border-t-signal-red" />
            <p className="mt-2 text-sm text-steel">Loading tax rates...</p>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No tax rates"
            description={search ? 'No tax rates match your search.' : 'No tax rates found. Add your first tax rate.'}
            icon={Percent}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-iron/30 text-left text-xs font-medium uppercase tracking-wider text-steel">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Country</th>
                  <th className="px-4 py-3">Rate</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Default</th>
                  <th className="px-4 py-3">Active</th>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-iron/30">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-deep-carbon/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-pure-white">{item.name}</td>
                    <td className="px-4 py-3 text-sm text-steel">{item.countryName ?? '—'}</td>
                    <td className="px-4 py-3 text-sm font-mono text-pure-white">{item.rate}%</td>
                    <td className="px-4 py-3 text-xs text-steel capitalize">{item.type}</td>
                    <td className="px-4 py-3">
                      {item.isDefault ? (
                        <span className="inline-flex items-center rounded-full bg-signal-red/10 px-2 py-0.5 text-xs font-medium text-signal-red">Default</span>
                      ) : (
                        <span className="text-xs text-steel">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${item.isActive ? 'bg-green-500/10 text-green-400' : 'bg-iron/30 text-steel'}`}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-steel">{item.displayOrder ?? 0}</td>
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
        <DialogContent className="bg-carbon border-iron max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-pure-white">
              {editing ? 'Edit Tax Rate' : 'New Tax Rate'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <FormField name="name" label="Name" required>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="VAT 10%"
                className="bg-deep-carbon border-iron/30 text-pure-white"
              />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField name="rate" label="Rate (%)" required>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={form.rate}
                  onChange={(e) => setForm((f) => ({ ...f, rate: parseFloat(e.target.value) || 0 }))}
                  className="bg-deep-carbon border-iron/30 text-pure-white"
                />
              </FormField>
              <FormField name="type" label="Type">
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'percentage' | 'fixed' }))}
                  className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </FormField>
            </div>
            <FormField name="countryId" label="Country (optional - blank for global)">
              <Input
                value={form.countryId}
                onChange={(e) => setForm((f) => ({ ...f, countryId: e.target.value }))}
                placeholder="Country UUID (leave blank for global)"
                className="bg-deep-carbon border-iron/30 text-pure-white"
              />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField name="isDefault" label="Default Tax Rate">
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, isDefault: !f.isDefault }))}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${form.isDefault ? 'bg-signal-red' : 'bg-iron/50'}`}
                  >
                    <span className={`pointer-events-none inline-block size-5 rounded-full bg-white shadow-lg transition-transform ${form.isDefault ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                  <span className="text-sm text-ash">{form.isDefault ? 'Default' : 'Not default'}</span>
                </div>
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
            <FormField name="displayOrder" label="Display Order">
              <Input
                type="number"
                value={form.displayOrder}
                onChange={(e) => setForm((f) => ({ ...f, displayOrder: parseInt(e.target.value) || 0 }))}
                className="bg-deep-carbon border-iron/30 text-pure-white"
              />
            </FormField>
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
        title="Delete Tax Rate"
        description={`Are you sure you want to delete "${deleteTarget?.name}"?`}
        variant="destructive"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}

export { TaxClient };
