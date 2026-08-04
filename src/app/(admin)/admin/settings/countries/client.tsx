'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Globe, Download, Database, Search, RotateCcw, Upload, X } from 'lucide-react';
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
  listCountries,
  createCountry,
  updateCountry,
  deleteCountry,
  restoreCountry,
  initializeReferenceData,
  listActiveContinents,
  listActiveCurrencies,
} from '@/server/actions/countriesActions';

interface Country {
  id: string;
  name: string;
  slug: string;
  flagImage: string | null;
  currencyId: string | null;
  continentId: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  continentName: string | null;
  currencyCode: string | null;
  currencySymbol: string | null;
}

interface Continent { id: string; name: string; }
interface Currency { id: string; name: string; code: string; symbol: string | null; }

const defaultForm = {
  name: '', slug: '', flagImage: '', currencyId: '',
  continentId: '', isActive: true, displayOrder: 0,
};

function CountriesClient() {
  const [items, setItems] = useState<Country[]>([]);
  const [continents, setContinents] = useState<Continent[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterContinent, setFilterContinent] = useState('');
  const [filterActive, setFilterActive] = useState<string>('');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Country | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Country | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: 20 };
      if (search) params.search = search;
      if (filterContinent) params.continentId = filterContinent;
      if (filterActive) params.isActive = filterActive === 'true';
      params.sort = { column: 'name', direction: 'asc' };

      const result = await listCountries(params);
      if (result.success) {
        const d = result.data as { data: Country[]; meta: typeof meta } | undefined;
        setItems(Array.isArray(d?.data) ? d!.data : []);
        setMeta(d?.meta ?? { total: 0, page: 1, limit: 20, totalPages: 0 });
      } else {
        setFeedback({ type: 'error', message: result.error ?? 'Failed to load' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to load' });
    } finally {
      setLoading(false);
    }
  }, [page, search, filterContinent, filterActive]);

  const fetchContinents = useCallback(async () => {
    const result = await listActiveContinents();
    if (result.success) setContinents(Array.isArray(result.data) ? result.data as Continent[] : []);
  }, []);

  const fetchCurrencies = useCallback(async () => {
    const result = await listActiveCurrencies();
    if (result.success) setCurrencies(Array.isArray(result.data) ? result.data as Currency[] : []);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchContinents(); fetchCurrencies(); }, [fetchContinents, fetchCurrencies]);

  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  function autoSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function openCreate() {
    setEditing(null);
    setForm({ ...defaultForm, displayOrder: meta.total });
    setDialogOpen(true);
  }

  function openEdit(item: Country) {
    setEditing(item);
    setForm({
      name: item.name,
      slug: item.slug ?? '',
      flagImage: item.flagImage ?? '',
      currencyId: item.currencyId ?? '',
      continentId: item.continentId ?? '',
      isActive: item.isActive ?? true,
      displayOrder: item.displayOrder ?? 0,
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
        slug: form.slug.trim() || autoSlug(form.name.trim()),
        flagImage: form.flagImage.trim() || undefined,
        currencyId: form.currencyId || undefined,
        continentId: form.continentId || undefined,
        isActive: form.isActive,
        displayOrder: form.displayOrder,
      };
      const result = editing
        ? await updateCountry(editing.id, payload)
        : await createCountry(payload);
      if (result.success) {
        setFeedback({ type: 'success', message: editing ? 'Country updated' : 'Country created' });
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
      const result = await deleteCountry(deleteTarget.id);
      if (result.success) {
        setFeedback({ type: 'success', message: 'Country deleted' });
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

  async function handleImport() {
    setImporting(true);
    try {
      const result = await initializeReferenceData();
      if (result.success) {
        const d = (result.data ?? {}) as {
          continentsCreated?: number;
          currenciesCreated?: number;
          countriesCreated?: number;
          countriesUpdated?: number;
          countriesSkipped?: number;
          durationMs?: number;
        };
        const parts: string[] = [];
        if (d.countriesCreated) parts.push(`${d.countriesCreated} created`);
        if (d.countriesUpdated) parts.push(`${d.countriesUpdated} updated`);
        if (d.countriesSkipped) parts.push(`${d.countriesSkipped} unchanged`);
        if (d.continentsCreated) parts.push(`${d.continentsCreated} continents`);
        if (d.currenciesCreated) parts.push(`${d.currenciesCreated} currencies`);
        if (d.durationMs) parts.push(`${(d.durationMs / 1000).toFixed(1)}s`);
        setFeedback({ type: 'success', message: `Reference data initialized: ${parts.join(' | ')}` });
        await fetchData();
        await fetchContinents();
        await fetchCurrencies();
      } else {
        setFeedback({ type: 'error', message: result.error ?? 'Import failed' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Import failed' });
    } finally {
      setImporting(false);
    }
  }

  async function handleRestore(item: Country) {
    try {
      const result = await restoreCountry(item.id);
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

  function handleExportCsv() {
    const data = Array.isArray(items) ? items : [];
    const headers = ['Country', 'Slug', 'Currency', 'Continent', 'Active', 'Display Order'];
    const rows = data.map((c) => [
      c.name, c.slug, c.currencyCode ?? '', c.continentName ?? '',
      c.isActive ? 'Yes' : 'No', String(c.displayOrder ?? 0),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `countries-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Countries" description="Manage countries for the marketplace">
        <Button variant="outline" size="sm" onClick={handleImport} disabled={importing}>
          <Database className={`mr-1 size-4 ${importing ? 'animate-spin' : ''}`} />
          {importing ? 'Initializing...' : 'Initialize Reference Data'}
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportCsv}>
          <Download className="mr-1 size-4" />
          Export CSV
        </Button>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-1 size-4" />
          Add Country
        </Button>
      </PageHeader>

      {feedback && (
        <div className={`rounded-[6px] px-4 py-3 text-sm ${feedback.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-signal-red/10 text-signal-red border border-signal-red/30'}`}>
          {feedback.message}
        </div>
      )}

      <div className="rounded-[10px] border border-iron/30 bg-carbon">
        <div className="flex flex-wrap items-center gap-3 border-b border-iron/30 p-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-steel" />
              <Input
                placeholder="Search countries..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="bg-deep-carbon border-iron/30 text-pure-white pl-9"
              />
            </div>
          </div>
          <select
            value={filterContinent}
            onChange={(e) => { setFilterContinent(e.target.value); setPage(1); }}
            className="rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white"
          >
            <option value="">All Continents</option>
            {continents.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={filterActive}
            onChange={(e) => { setFilterActive(e.target.value); setPage(1); }}
            className="rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block size-6 animate-spin rounded-full border-2 border-iron border-t-signal-red" />
            <p className="mt-2 text-sm text-steel">Loading countries...</p>
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="No countries"
            description={search || filterContinent || filterActive ? 'No countries match your filters.' : 'No countries found. Add or sync countries.'}
            icon={Globe}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-iron/30 text-left text-xs font-medium uppercase tracking-wider text-steel">
                    <th className="px-4 py-3">Flag</th>
                    <th className="px-4 py-3">Country</th>
                    <th className="px-4 py-3">Currency</th>
                    <th className="px-4 py-3">Continent</th>
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Active</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-iron/30">
                  {items.map((c) => (
                    <tr key={c.id} className="hover:bg-deep-carbon/50 transition-colors">
                      <td className="px-4 py-3">
                        {c.flagImage ? (
                          <img src={c.flagImage} alt={c.name} className="h-5 w-8 rounded-sm object-cover" />
                        ) : (
                          <span className="text-sm text-steel">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-pure-white">{c.name}</span>
                        <p className="text-xs text-steel font-mono">{c.slug}</p>
                      </td>
                      <td className="px-4 py-3">
                        {c.currencyCode ? (
                          <span className="text-xs text-steel">{c.currencyCode} {c.currencySymbol ?? ''}</span>
                        ) : (
                          <span className="text-xs text-steel">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-steel">{c.continentName ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-steel">{c.displayOrder ?? 0}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${c.isActive ? 'bg-green-500/10 text-green-400' : 'bg-iron/30 text-steel'}`}>
                          {c.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon-xs" onClick={() => openEdit(c)}>
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon-xs" onClick={() => handleRestore(c)} title="Restore">
                            <RotateCcw className="size-3.5 text-green-400" />
                          </Button>
                          <Button variant="ghost" size="icon-xs" onClick={() => setDeleteTarget(c)}>
                            <Trash2 className="size-3.5 text-signal-red" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {meta.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-iron/30 px-4 py-3">
                <p className="text-xs text-steel">
                  Showing {((meta.page - 1) * meta.limit) + 1} to {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                    Previous
                  </Button>
                  <span className="text-xs text-steel">Page {meta.page} of {meta.totalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages}>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-carbon border-iron max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-pure-white">
              {editing ? 'Edit Country' : 'New Country'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField name="name" label="Country Name" required>
                <Input value={form.name} onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({ ...f, name, slug: autoSlug(name) }));
                }} placeholder="Japan" className="bg-deep-carbon border-iron/30 text-pure-white" />
              </FormField>
              <FormField name="slug" label="Slug">
                <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="auto-generated" className="bg-deep-carbon border-iron/30 text-pure-white" />
              </FormField>
            </div>
            <FormField name="flagImage" label="Flag Image">
              <div className="space-y-2">
                {form.flagImage && (
                  <div className="relative inline-block">
                    <img
                      src={form.flagImage}
                      alt="Flag preview"
                      className="h-10 w-16 rounded-sm object-cover border border-iron/30"
                    />
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, flagImage: '' }))}
                      className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-signal-red text-white flex items-center justify-center hover:bg-signal-red/80"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                )}
                <label className="flex items-center gap-2 cursor-pointer rounded-[6px] border border-dashed border-iron/30 px-4 py-3 text-sm text-steel hover:border-signal-red/50 hover:text-pure-white transition-colors">
                  <Upload className="size-4" />
                  <span>Upload flag image</span>
                  <input
                    type="file"
                    accept="image/svg+xml,image/png,image/webp"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 1024 * 1024) {
                        setFeedback({ type: 'error', message: 'File size must be under 1 MB' });
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => {
                        const dataUrl = reader.result as string;
                        setForm((f) => ({ ...f, flagImage: dataUrl }));
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
                {!form.flagImage && (
                  <Input
                    value={form.flagImage}
                    onChange={(e) => setForm((f) => ({ ...f, flagImage: e.target.value }))}
                    placeholder="Or enter storage path (e.g. flags/japan.svg)"
                    className="bg-deep-carbon border-iron/30 text-pure-white"
                  />
                )}
              </div>
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField name="currencyId" label="Currency">
                <select
                  value={form.currencyId}
                  onChange={(e) => setForm((f) => ({ ...f, currencyId: e.target.value }))}
                  className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white"
                >
                  <option value="">Select currency</option>
                  {currencies.map((c) => (
                    <option key={c.id} value={c.id}>{c.code} — {c.name} ({c.symbol ?? ''})</option>
                  ))}
                </select>
              </FormField>
              <FormField name="continentId" label="Continent">
                <select
                  value={form.continentId}
                  onChange={(e) => setForm((f) => ({ ...f, continentId: e.target.value }))}
                  className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white"
                >
                  <option value="">Select continent</option>
                  {continents.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField name="displayOrder" label="Display Order">
                <Input type="number" value={form.displayOrder} onChange={(e) => setForm((f) => ({ ...f, displayOrder: parseInt(e.target.value) || 0 }))} className="bg-deep-carbon border-iron/30 text-pure-white" />
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
        title="Delete Country"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? Vehicles referencing this country will have their country field cleared.`}
        variant="destructive"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}

export { CountriesClient };
