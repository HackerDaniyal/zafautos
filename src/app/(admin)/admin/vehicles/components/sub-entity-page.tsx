'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, AlertTriangle, Pipette, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  MakeLogo,
  CAR_COLOR_PRESETS,
  getSuggestedBrandLogoUrl,
  isValidHex,
  normalizeHexInput,
} from '@/components/admin/vehicles/entity-visuals';
import { EmptyState } from '@/components/admin/ui/empty-state';
import { ConfirmDialog } from '@/components/admin/dialogs/confirm-dialog';
import { FormField } from '@/components/admin/forms/form-field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/admin/ui/skeletons';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface SubEntity {
  id: string;
  name: string;
  slug?: string | null;
  createdAt?: string;
  [key: string]: unknown;
}

interface ActionResultLike {
  success: boolean;
  data?: unknown;
  error?: string;
  code?: string;
}

export interface SubEntityExtraField {
  key: string;
  label: string;
  type: 'text' | 'url' | 'select' | 'image' | 'color';
  placeholder?: string;
  required?: boolean;
  /** For 'image': auto-fetch the official brand logo from the Name field */
  autoBrandLogo?: boolean;
  optionsAction?: () => Promise<ActionResultLike>;
}

interface SubEntityPageProps {
  title: string;
  description: string;
  addActionLabel: string;
  singular: string;
  listAction: () => Promise<ActionResultLike>;
  createAction: (data: Record<string, unknown>) => Promise<ActionResultLike>;
  updateAction: (id: string, data: Record<string, unknown>) => Promise<ActionResultLike>;
  deleteAction: (id: string) => Promise<ActionResultLike>;
  extraFields?: SubEntityExtraField[];
  /** Optional live visual preview rendered under the Name input in the dialog */
  namePreview?: (name: string) => React.ReactNode;
  /** Optional visual badge/icon rendered inline with the name in the table */
  renderVisual?: (item: SubEntity) => React.ReactNode;
  category?: 'manufacturer' | 'model' | 'bodyType' | 'fuelType' | 'transmission' | 'driveType' | 'color';
  countAction?: () => Promise<ActionResultLike>;
}

const NONE_SENTINEL = '__none__';

function extractOptions(data: unknown): { id: string; name: string }[] {
  if (Array.isArray(data)) return data as { id: string; name: string }[];
  if (data && typeof data === 'object' && Array.isArray((data as { data?: unknown }).data)) {
    return (data as { data: { id: string; name: string }[] }).data;
  }
  return [];
}

function buildCountMap(data: unknown): Record<string, number> {
  if (Array.isArray(data)) {
    return data.reduce<Record<string, number>>((acc, row) => {
      const r = row as { id: string; count: number };
      if (r.id) acc[r.id] = r.count;
      return acc;
    }, {});
  }
  return {};
}

function formatDate(val: unknown): string {
  if (!val) return '—';
  try {
    return new Date(val as string).toLocaleDateString();
  } catch {
    return '—';
  }
}

export function SubEntityPage({
  title,
  description,
  addActionLabel,
  singular,
  listAction,
  createAction,
  updateAction,
  deleteAction,
  extraFields = [],
  namePreview,
  renderVisual,
  category,
  countAction,
}: SubEntityPageProps) {
  const [items, setItems] = useState<SubEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SubEntity | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({ name: '' });
  const [saving, setSaving] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<SubEntity | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [options, setOptions] = useState<Record<string, { id: string; name: string }[]>>({});
  const [optionsLoading, setOptionsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listAction();
      if (result.success) {
        setItems(result.data as SubEntity[]);
      } else {
        setFeedback({ type: 'error', message: result.error ?? 'Failed to load data' });
      }
      if (countAction) {
        const countResult = await countAction();
        if (countResult.success) {
          setCounts(buildCountMap(countResult.data));
        }
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  }, [listAction, countAction]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Auto-fetch brand logos from the Name field for image fields with autoBrandLogo
  useEffect(() => {
    const logoFields = extraFields.filter((f) => f.type === 'image' && f.autoBrandLogo);
    if (logoFields.length === 0) return;
    const suggested = getSuggestedBrandLogoUrl(formValues.name ?? '');
    if (!suggested) return;
    const timer = setTimeout(() => {
      setFormValues((prev) => {
        const next = { ...prev };
        let changed = false;
        for (const f of logoFields) {
          if (!prev[f.key]) {
            next[f.key] = suggested;
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [formValues.name, extraFields]);

  const loadOptions = useCallback(async () => {
    const selectFields = extraFields.filter((f) => f.type === 'select' && f.optionsAction);
    if (selectFields.length === 0) return;
    setOptionsLoading(true);
    try {
      const entries = await Promise.all(
        selectFields.map(async (f) => {
          const res = await f.optionsAction!();
          return [f.key, res.success ? extractOptions(res.data) : []] as const;
        })
      );
      setOptions(Object.fromEntries(entries));
    } catch {
      // ignore
    } finally {
      setOptionsLoading(false);
    }
  }, [extraFields]);

  function openCreate() {
    setEditingItem(null);
    setFormValues({ name: '' });
    loadOptions();
    setDialogOpen(true);
  }

  function openEdit(item: SubEntity) {
    setEditingItem(item);
    const values: Record<string, string> = { name: item.name ?? '' };
    for (const field of extraFields) {
      const raw = item[field.key];
      values[field.key] = raw ? String(raw) : '';
    }
    setFormValues(values);
    loadOptions();
    setDialogOpen(true);
  }

  function setFieldValue(key: string, value: string) {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!formValues.name?.trim()) {
      setFeedback({ type: 'error', message: 'Name is required' });
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { name: formValues.name.trim() };
      for (const field of extraFields) {
        let raw = formValues[field.key] ?? '';
        if (raw === NONE_SENTINEL) raw = '';
        if (field.type === 'color' && raw.trim()) {
          const hex = normalizeHexInput(raw);
          if (!isValidHex(hex)) {
            setFeedback({ type: 'error', message: `${field.label} must be a hex code like #RRGGBB` });
            setSaving(false);
            return;
          }
          payload[field.key] = hex;
          continue;
        }
        payload[field.key] = raw === '' ? null : raw.trim();
      }

      const result = editingItem
        ? await updateAction(editingItem.id, payload)
        : await createAction(payload);

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
    const linked = category ? counts[deleteDialog.id] ?? 0 : 0;
    if (linked > 0) {
      setFeedback({
        type: 'error',
        message: `Cannot delete this ${singular}: ${linked} vehicle(s) are linked to it.`,
      });
      setDeleteDialog(null);
      return;
    }
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
      {/* Header */}
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

      {/* Feedback */}
      {feedback && (
        <div className={`rounded-[6px] px-4 py-3 text-sm ${feedback.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-signal-red/10 text-signal-red border border-signal-red/30'}`}>
          {feedback.message}
        </div>
      )}

      {/* Search + Count */}
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-sm">
          <Input
            placeholder={`Search ${title.toLowerCase()}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-deep-carbon border-iron/30 text-pure-white"
          />
        </div>
        <p className="text-sm text-ash">
          <span className="font-medium text-pure-white">{filtered.length}</span> {singular}{filtered.length === 1 ? '' : 's'}
        </p>
      </div>

      {/* Table */}
      <div className="rounded-[10px] border border-iron/30 bg-carbon overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-5 flex-1" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-16" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={`No ${title.toLowerCase()}`}
            description={search ? 'No items match your search.' : `No ${title.toLowerCase()} found. Create your first one.`}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-iron/30 hover:bg-transparent">
                <TableHead className="text-steel">Name</TableHead>
                {category && (
                  <TableHead className="text-steel text-right">Vehicles</TableHead>
                )}
                <TableHead className="text-steel">Created</TableHead>
                <TableHead className="text-steel text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => {
                const count = category ? counts[item.id] ?? 0 : 0;
                const isReferenced = category && count > 0;
                return (
                  <TableRow key={item.id} className="border-iron/30">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {renderVisual && <span className="flex items-center">{renderVisual(item)}</span>}
                        <div>
                          <p className="text-sm font-medium text-pure-white">{item.name}</p>
                          {item.slug && <p className="text-xs text-steel font-mono">{item.slug}</p>}
                        </div>
                      </div>
                    </TableCell>
                    {category && (
                      <TableCell className="text-right">
                        {isReferenced ? (
                          <span className="inline-flex items-center gap-1 text-xs text-auction-amber">
                            <AlertTriangle className="size-3" />
                            {count}
                          </span>
                        ) : (
                          <span className="text-xs text-steel">0</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      <span className="text-xs text-steel">{formatDate(item.createdAt)}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon-xs" onClick={() => openEdit(item)}>
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => setDeleteDialog(item)}
                          disabled={isReferenced}
                          title={isReferenced ? `Cannot delete: ${count} vehicle(s) linked` : 'Delete'}
                        >
                          <Trash2 className={`size-3.5 ${isReferenced ? 'text-steel' : 'text-signal-red'}`} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-carbon border-iron">
          <DialogHeader>
            <DialogTitle className="text-pure-white">
              {editingItem ? `Edit ${singular}` : `New ${singular}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <FormField name="name" label="Name" required>
              <Input
                value={formValues.name}
                onChange={(e) => setFieldValue('name', e.target.value)}
                placeholder={`Enter ${singular} name`}
                className="bg-deep-carbon border-iron/30 text-pure-white"
                onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
              />
            </FormField>

            {namePreview && formValues.name?.trim() && (
              <div className="flex items-center justify-center rounded-[8px] border border-iron/30 bg-deep-carbon px-3 py-2.5">
                {namePreview(formValues.name.trim())}
              </div>
            )}

            {extraFields.map((field) => (
              <FormField key={field.key} name={field.key} label={field.label} required={field.required}>
                {field.type === 'select' ? (
                  <Select
                    value={formValues[field.key] ?? NONE_SENTINEL}
                    onValueChange={(v) => setFieldValue(field.key, v)}
                  >
                    <SelectTrigger className="bg-deep-carbon border-iron/30 text-pure-white">
                      <SelectValue placeholder={optionsLoading ? 'Loading...' : `Select ${field.label.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent className="bg-carbon border-iron">
                      <SelectItem value={NONE_SENTINEL}>None</SelectItem>
                      {(options[field.key] ?? []).map((opt) => (
                        <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : field.type === 'image' ? (
                  (() => {
                    const suggested = getSuggestedBrandLogoUrl(formValues.name);
                    const current = (formValues[field.key] ?? '').trim();
                    return (
                  <div className="flex items-start gap-3">
                    <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-[8px] border border-iron/30 bg-deep-carbon p-1.5">
                      <MakeLogo
                        name={formValues.name ?? ''}
                        url={formValues[field.key] || undefined}
                        className="size-full"
                      />
                    </span>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <Input
                        value={formValues[field.key] ?? ''}
                        onChange={(e) => setFieldValue(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        type="url"
                        className="bg-deep-carbon border-iron/30 text-pure-white"
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
                      />
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-steel">Auto-fetched from the name — paste a URL to override.</p>
                        {suggested && current && current !== suggested && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon-xs"
                            title={`Use auto-fetched ${field.label.toLowerCase()}`}
                            onClick={() => setFieldValue(field.key, suggested)}
                          >
                            <Wand2 className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                    );
                  })()
                ) : field.type === 'color' ? (
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3">
                      <label
                        className="relative block size-11 shrink-0 cursor-pointer overflow-hidden rounded-[8px] border border-white/20 shadow-inner transition hover:scale-105"
                        style={
                          isValidHex(normalizeHexInput(formValues[field.key] ?? ''))
                            ? { backgroundColor: normalizeHexInput(formValues[field.key]) }
                            : undefined
                        }
                        title="Open the color wheel"
                      >
                        {!isValidHex(normalizeHexInput(formValues[field.key] ?? '')) && (
                          <Pipette className="pointer-events-none absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 text-steel" />
                        )}
                        <input
                          type="color"
                          value={isValidHex(normalizeHexInput(formValues[field.key] ?? ''))
                            ? normalizeHexInput(formValues[field.key])
                            : '#101114'}
                          onChange={(e) => setFieldValue(field.key, e.target.value.toUpperCase())}
                          className="absolute inset-0 size-full cursor-pointer opacity-0"
                          aria-label={`Pick ${field.label.toLowerCase()}`}
                        />
                      </label>
                      <Input
                        value={formValues[field.key] ?? ''}
                        onChange={(e) => setFieldValue(field.key, normalizeHexInput(e.target.value))}
                        placeholder="#RRGGBB"
                        maxLength={7}
                        className="w-28 bg-deep-carbon border-iron/30 text-pure-white font-mono uppercase"
                      />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {CAR_COLOR_PRESETS.map((preset) => (
                        <button
                          key={preset.hex}
                          type="button"
                          title={`${preset.name} (${preset.hex})`}
                          aria-label={preset.name}
                          onClick={() => setFieldValue(field.key, preset.hex)}
                          className={`size-6 rounded-full border transition hover:scale-110 ${
                            (formValues[field.key] ?? '').toUpperCase() === preset.hex
                              ? 'border-signal-red ring-1 ring-signal-red'
                              : 'border-white/15'
                          }`}
                          style={{ backgroundColor: preset.hex }}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-steel">
                      Click the swatch to open the color wheel, or pick a factory paint preset.
                    </p>
                  </div>
                ) : (
                  <Input
                    value={formValues[field.key] ?? ''}
                    onChange={(e) => setFieldValue(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    type={field.type === 'url' ? 'url' : 'text'}
                    className="bg-deep-carbon border-iron/30 text-pure-white"
                  />
                )}
              </FormField>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !formValues.name?.trim()}>
              {saving ? 'Saving...' : editingItem ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteDialog}
        onOpenChange={() => setDeleteDialog(null)}
        title={`Delete ${singular}`}
        description={
          deleteDialog && category && (counts[deleteDialog.id] ?? 0) > 0
            ? `This ${singular} cannot be deleted because ${(counts[deleteDialog.id] ?? 0)} vehicle(s) are linked to it. Reassign or remove those vehicles first.`
            : `Are you sure you want to delete "${deleteDialog?.name}"? This action cannot be undone.`
        }
        variant="destructive"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
