'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, DollarSign, RotateCcw } from 'lucide-react';
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
  listCurrencies,
  createCurrency,
  updateCurrency,
  deleteCurrency,
  restoreCurrency,
} from '@/server/actions/currenciesActions';

interface Currency {
  id: string;
  name: string;
  code: string;
  symbol: string | null;
  decimalPlaces: number;
  symbolPosition: 'before' | 'after';
  isDefault: boolean;
  exchangeRate: number;
  lastUpdated: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
}

const defaultForm = {
  name: '', code: '', symbol: '', decimalPlaces: 2,
  symbolPosition: 'before' as 'before' | 'after', isDefault: false,
  exchangeRate: 1, displayOrder: 0, isActive: true,
};

function CurrenciesClient() {
  const [items, setItems] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Currency | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Currency | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listCurrencies();
      if (result.success) {
        const data = (result.data as Currency[]).sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
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

  function openEdit(item: Currency) {
    setEditing(item);
    setForm({
      name: item.name,
      code: item.code,
      symbol: item.symbol ?? '',
      decimalPlaces: item.decimalPlaces ?? 2,
      symbolPosition: item.symbolPosition ?? 'before',
      isDefault: item.isDefault ?? false,
      exchangeRate: item.exchangeRate ?? 1,
      displayOrder: item.displayOrder ?? 0,
      isActive: item.isActive ?? true,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.code.trim()) {
      setFeedback({ type: 'error', message: 'Name and Code are required' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        symbol: form.symbol.trim() || undefined,
        decimalPlaces: form.decimalPlaces,
        symbolPosition: form.symbolPosition,
        isDefault: form.isDefault,
        exchangeRate: form.exchangeRate,
        displayOrder: form.displayOrder,
        isActive: form.isActive,
      };
      const result = editing
        ? await updateCurrency(editing.id, payload)
        : await createCurrency(payload);
      if (result.success) {
        setFeedback({ type: 'success', message: editing ? 'Currency updated' : 'Currency created' });
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
      const result = await deleteCurrency(deleteTarget.id);
      if (result.success) {
        setFeedback({ type: 'success', message: 'Currency deleted' });
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

  async function handleRestore(item: Currency) {
    try {
      const result = await restoreCurrency(item.id);
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

  const filtered = items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()) || i.code.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <PageHeader title="Currencies" description="Manage currencies for the marketplace">
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-1 size-4" />
          Add Currency
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
            placeholder="Search currencies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-deep-carbon border-iron/30 text-pure-white max-w-sm"
          />
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block size-6 animate-spin rounded-full border-2 border-iron border-t-signal-red" />
            <p className="mt-2 text-sm text-steel">Loading currencies...</p>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No currencies"
            description={search ? 'No currencies match your search.' : 'No currencies found. Add your first currency.'}
            icon={DollarSign}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-iron/30 text-left text-xs font-medium uppercase tracking-wider text-steel">
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Symbol</th>
                  <th className="px-4 py-3">Decimals</th>
                  <th className="px-4 py-3">Position</th>
                  <th className="px-4 py-3">Rate</th>
                  <th className="px-4 py-3">Default</th>
                  <th className="px-4 py-3">Active</th>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-iron/30">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-deep-carbon/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono font-medium text-pure-white">{item.code}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-pure-white">{item.name}</td>
                    <td className="px-4 py-3 text-sm text-steel">{item.symbol ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-steel">{item.decimalPlaces}</td>
                    <td className="px-4 py-3 text-xs text-steel">{item.symbolPosition}</td>
                    <td className="px-4 py-3 text-xs font-mono text-steel">{item.exchangeRate}</td>
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
              {editing ? 'Edit Currency' : 'New Currency'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField name="code" label="Code" required>
                <Input
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="USD"
                  className="bg-deep-carbon border-iron/30 text-pure-white"
                />
              </FormField>
              <FormField name="symbol" label="Symbol">
                <Input
                  value={form.symbol}
                  onChange={(e) => setForm((f) => ({ ...f, symbol: e.target.value }))}
                  placeholder="$"
                  className="bg-deep-carbon border-iron/30 text-pure-white"
                />
              </FormField>
            </div>
            <FormField name="name" label="Name" required>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="US Dollar"
                className="bg-deep-carbon border-iron/30 text-pure-white"
              />
            </FormField>
            <div className="grid grid-cols-3 gap-4">
              <FormField name="decimalPlaces" label="Decimal Places">
                <Input
                  type="number"
                  min={0}
                  max={4}
                  value={form.decimalPlaces}
                  onChange={(e) => setForm((f) => ({ ...f, decimalPlaces: parseInt(e.target.value) || 0 }))}
                  className="bg-deep-carbon border-iron/30 text-pure-white"
                />
              </FormField>
              <FormField name="symbolPosition" label="Symbol Position">
                <select
                  value={form.symbolPosition}
                  onChange={(e) => setForm((f) => ({ ...f, symbolPosition: e.target.value as 'before' | 'after' }))}
                  className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white"
                >
                  <option value="before">$100</option>
                  <option value="after">100$</option>
                </select>
              </FormField>
              <FormField name="displayOrder" label="Display Order">
                <Input
                  type="number"
                  value={form.displayOrder}
                  onChange={(e) => setForm((f) => ({ ...f, displayOrder: parseInt(e.target.value) || 0 }))}
                  className="bg-deep-carbon border-iron/30 text-pure-white"
                />
              </FormField>
            </div>
            <FormField name="exchangeRate" label="Exchange Rate (vs USD)">
              <Input
                type="number"
                step="0.000001"
                min="0"
                value={form.exchangeRate}
                onChange={(e) => setForm((f) => ({ ...f, exchangeRate: parseFloat(e.target.value) || 1 }))}
                placeholder="1.0"
                className="bg-deep-carbon border-iron/30 text-pure-white"
              />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField name="isDefault" label="Default Currency">
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.name.trim() || !form.code.trim()}>
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Delete Currency"
        description={`Are you sure you want to delete "${deleteTarget?.name}" (${deleteTarget?.code})? Countries referencing this currency will have their currency field cleared.`}
        variant="destructive"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}

export { CurrenciesClient };
