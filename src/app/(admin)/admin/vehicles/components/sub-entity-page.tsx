'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  type: 'text' | 'url' | 'select';
  placeholder?: string;
  required?: boolean;
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
  category?: 'manufacturer' | 'model' | 'bodyType' | 'fuelType' | 'transmission' | 'driveType' | 'color';
  countAction?: () => Promise<ActionResultLike>;
  extraColumns?: { header: string; render: (item: SubEntity, options: Record<string, { id: string; name: string }[]>) => React.ReactNode }[];
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
  category,
  countAction,
  extraColumns = [],
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
        const raw = formValues[field.key] ?? '';
        payload[field.key] = raw === NONE_SENTINEL || raw === '' ? null : raw;
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
                {extraColumns.map((col, i) => (
                  <TableHead key={i} className="text-steel">{col.header}</TableHead>
                ))}
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
                      <div>
                        <p className="text-sm font-medium text-pure-white">{item.name}</p>
                        {item.slug && <p className="text-xs text-steel font-mono">{item.slug}</p>}
                      </div>
                    </TableCell>
                    {extraColumns.map((col, i) => (
                      <TableCell key={i}>{col.render(item, options)}</TableCell>
                    ))}
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
