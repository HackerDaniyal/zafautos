'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, FileText, RotateCcw, Upload } from 'lucide-react';
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
  listDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  restoreDocument,
  uploadDocumentFile,
} from '@/server/actions/documentActions';

interface DocumentItem {
  id: string;
  title: string;
  documentUrl: string;
  vehicleId: string | null;
  userId: string | null;
  createdAt: string;
  createdBy: string | null;
}

function DocumentsClient() {
  const [items, setItems] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DocumentItem | null>(null);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DocumentItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [form, setForm] = useState({
    title: '',
    documentUrl: '',
    vehicleId: '',
    userId: '',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const docsResult = await listDocuments({ limit: 50, search });

      if (docsResult.success) {
        const data = ((docsResult.data as { data: DocumentItem[] }).data ?? docsResult.data as DocumentItem[]);
        setItems(data);
      } else {
        setFeedback({ type: 'error', message: (docsResult as { error?: string }).error ?? 'Failed to load documents' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to load' });
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  function openCreate() {
    setEditing(null);
    setForm({ title: '', documentUrl: '', vehicleId: '', userId: '' });
    setDialogOpen(true);
  }

  function openEdit(item: DocumentItem) {
    setEditing(item);
    setForm({
      title: item.title,
      documentUrl: item.documentUrl,
      vehicleId: item.vehicleId ?? '',
      userId: item.userId ?? '',
    });
    setDialogOpen(true);
  }

  async function handleFileUpload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const result = await uploadDocumentFile(fd);
      if (result.success && result.data) {
        setForm((f) => ({ ...f, documentUrl: result.data!.url }));
        setFeedback({ type: 'success', message: 'File uploaded' });
      } else {
        setFeedback({ type: 'error', message: (result as { error?: string }).error ?? 'Upload failed' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Upload failed' });
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!form.title.trim()) {
      setFeedback({ type: 'error', message: 'Title is required' });
      return;
    }
    if (!form.documentUrl.trim()) {
      setFeedback({ type: 'error', message: 'Document file is required' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        documentUrl: form.documentUrl.trim(),
        vehicleId: form.vehicleId.trim() || null,
        userId: form.userId.trim() || null,
      };
      const result = editing
        ? await updateDocument(editing.id, payload)
        : await createDocument(payload);
      if (result.success) {
        setFeedback({ type: 'success', message: editing ? 'Document updated' : 'Document created' });
        setDialogOpen(false);
        await fetchData();
      } else {
        setFeedback({ type: 'error', message: (result as { error?: string }).error ?? 'Failed to save' });
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
      const result = await deleteDocument(deleteTarget.id);
      if (result.success) {
        setFeedback({ type: 'success', message: 'Document deleted' });
        setDeleteTarget(null);
        await fetchData();
      } else {
        setFeedback({ type: 'error', message: (result as { error?: string }).error ?? 'Failed to delete' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to delete' });
    } finally {
      setDeleting(false);
    }
  }

  async function handleRestore(item: DocumentItem) {
    try {
      const result = await restoreDocument(item.id);
      if (result.success) {
        setFeedback({ type: 'success', message: `${item.title} restored` });
        await fetchData();
      } else {
        setFeedback({ type: 'error', message: (result as { error?: string }).error ?? 'Failed to restore' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to restore' });
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Documents" description="Manage documents and files">
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-1 size-4" />
          Add Document
        </Button>
      </PageHeader>

      {feedback && (
        <div className={`rounded-[6px] px-4 py-3 text-sm ${feedback.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-signal-red/10 text-signal-red border border-signal-red/30'}`}>
          {feedback.message}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search documents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-deep-carbon border-iron/30 text-pure-white max-w-sm"
        />
      </div>

      <div className="rounded-[10px] border border-iron/30 bg-carbon">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block size-6 animate-spin rounded-full border-2 border-iron border-t-signal-red" />
            <p className="mt-2 text-sm text-steel">Loading documents...</p>
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="No documents"
            description={search ? 'No documents match your filters.' : 'No documents found. Upload your first document.'}
            icon={FileText}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-iron/30 text-left text-xs font-medium uppercase tracking-wider text-steel">
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Vehicle</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-iron/30">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-deep-carbon/50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <span className="text-sm font-medium text-pure-white">{item.title}</span>
                        <a href={item.documentUrl} target="_blank" rel="noopener noreferrer" className="block text-xs text-steel hover:text-signal-red truncate max-w-xs">
                          {item.documentUrl}
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-steel">{item.vehicleId ? item.vehicleId.slice(0, 8) : '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-steel">{item.userId ? item.userId.slice(0, 8) : '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-steel">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon-xs" onClick={() => openEdit(item)}>
                          <Pencil className="size-3.5" />
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
              {editing ? 'Edit Document' : 'New Document'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <FormField name="title" label="Title" required>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Export Declaration Form"
                className="bg-deep-carbon border-iron/30 text-pure-white"
              />
            </FormField>

            <FormField name="file" label="Document File">
              {form.documentUrl ? (
                <div className="flex items-center justify-between rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2">
                  <a href={form.documentUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-signal-red truncate max-w-xs">
                    {form.documentUrl.split('/').pop()}
                  </a>
                  <Button variant="ghost" size="sm" onClick={() => setForm((f) => ({ ...f, documentUrl: '' }))}>
                    Remove
                  </Button>
                </div>
              ) : (
                <label className="inline-flex items-center gap-2 rounded-[6px] border border-iron bg-deep-carbon px-3 py-2 text-sm text-pure-white cursor-pointer hover:bg-white/5">
                  <Upload className="size-4" />
                  {uploading ? 'Uploading...' : 'Upload File'}
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />
                </label>
              )}
            </FormField>

            <FormField name="url" label="Document URL (alternative)">
              <Input
                value={form.documentUrl}
                onChange={(e) => setForm((f) => ({ ...f, documentUrl: e.target.value }))}
                placeholder="https://..."
                className="bg-deep-carbon border-iron/30 text-pure-white"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField name="vehicleId" label="Vehicle ID (optional)">
                <Input
                  value={form.vehicleId}
                  onChange={(e) => setForm((f) => ({ ...f, vehicleId: e.target.value }))}
                  placeholder="UUID"
                  className="bg-deep-carbon border-iron/30 text-pure-white font-mono text-xs"
                />
              </FormField>
              <FormField name="userId" label="User ID (optional)">
                <Input
                  value={form.userId}
                  onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
                  placeholder="UUID"
                  className="bg-deep-carbon border-iron/30 text-pure-white font-mono text-xs"
                />
              </FormField>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.title.trim() || !form.documentUrl.trim()}>
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Delete Document"
        description={`Are you sure you want to delete "${deleteTarget?.title}"?`}
        variant="destructive"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}

export { DocumentsClient };
