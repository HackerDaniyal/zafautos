'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Mail, RotateCcw, FileText, ScrollText } from 'lucide-react';
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
  listEmailTemplates,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
  restoreEmailTemplate,
  listEmailLogs,
} from '@/server/actions/emailActions';

interface EmailTemplate {
  id: string;
  name: string;
  key: string;
  description: string | null;
  subject: string | null;
  body: string | null;
  isActive: boolean;
  createdAt: string;
}

interface EmailLog {
  id: string;
  recipient: string;
  templateId: string | null;
  subject: string | null;
  content: string | null;
  status: string;
  errorMessage: string | null;
  sentAt: string;
  createdAt: string;
}

const defaultForm = {
  name: '', key: '', description: '', subject: '', body: '', isActive: true,
};

function EmailClient() {
  const [activeTab, setActiveTab] = useState<'templates' | 'logs'>('templates');
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<EmailTemplate | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listEmailTemplates();
      if (result.success) {
        setTemplates(result.data as EmailTemplate[]);
      } else {
        setFeedback({ type: 'error', message: result.error ?? 'Failed to load' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to load' });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listEmailLogs();
      if (result.success) {
        setLogs(result.data as EmailLog[]);
      } else {
        setFeedback({ type: 'error', message: result.error ?? 'Failed to load logs' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to load logs' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'templates') fetchTemplates();
    else fetchLogs();
  }, [activeTab, fetchTemplates, fetchLogs]);

  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  function openCreate() {
    setEditing(null);
    setForm({ ...defaultForm });
    setDialogOpen(true);
  }

  function openEdit(item: EmailTemplate) {
    setEditing(item);
    setForm({
      name: item.name,
      key: item.key,
      description: item.description ?? '',
      subject: item.subject ?? '',
      body: item.body ?? '',
      isActive: item.isActive ?? true,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.key.trim()) {
      setFeedback({ type: 'error', message: 'Name and Key are required' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        key: form.key.trim().toLowerCase().replace(/\s+/g, '_'),
        description: form.description.trim() || undefined,
        subject: form.subject.trim() || undefined,
        body: form.body.trim() || undefined,
        isActive: form.isActive,
      };
      const result = editing
        ? await updateEmailTemplate(editing.id, payload)
        : await createEmailTemplate(payload);
      if (result.success) {
        setFeedback({ type: 'success', message: editing ? 'Template updated' : 'Template created' });
        setDialogOpen(false);
        await fetchTemplates();
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
      const result = await deleteEmailTemplate(deleteTarget.id);
      if (result.success) {
        setFeedback({ type: 'success', message: 'Template deleted' });
        setDeleteTarget(null);
        await fetchTemplates();
      } else {
        setFeedback({ type: 'error', message: result.error ?? 'Failed to delete' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to delete' });
    } finally {
      setDeleting(false);
    }
  }

  async function handleRestore(item: EmailTemplate) {
    try {
      const result = await restoreEmailTemplate(item.id);
      if (result.success) {
        setFeedback({ type: 'success', message: `${item.name} restored` });
        await fetchTemplates();
      } else {
        setFeedback({ type: 'error', message: result.error ?? 'Failed to restore' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to restore' });
    }
  }

  const filteredTemplates = templates.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) || t.key.toLowerCase().includes(search.toLowerCase())
  );

  const filteredLogs = logs.filter((l) =>
    l.recipient.toLowerCase().includes(search.toLowerCase()) || (l.subject ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Email Settings" description="Manage email templates and view delivery logs">
        {activeTab === 'templates' && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1 size-4" />
            Add Template
          </Button>
        )}
      </PageHeader>

      {feedback && (
        <div className={`rounded-[6px] px-4 py-3 text-sm ${feedback.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-signal-red/10 text-signal-red border border-signal-red/30'}`}>
          {feedback.message}
        </div>
      )}

      <div className="flex gap-1 rounded-[10px] border border-iron/30 bg-carbon p-1">
        <button
          onClick={() => { setActiveTab('templates'); setSearch(''); }}
          className={`flex items-center gap-2 rounded-[6px] px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'templates' ? 'bg-signal-red/10 text-signal-red' : 'text-ash hover:bg-white/5 hover:text-pure-white'}`}
        >
          <FileText className="size-4" />
          Templates
        </button>
        <button
          onClick={() => { setActiveTab('logs'); setSearch(''); }}
          className={`flex items-center gap-2 rounded-[6px] px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'logs' ? 'bg-signal-red/10 text-signal-red' : 'text-ash hover:bg-white/5 hover:text-pure-white'}`}
        >
          <ScrollText className="size-4" />
          Delivery Logs
        </button>
      </div>

      <div className="rounded-[10px] border border-iron/30 bg-carbon">
        <div className="border-b border-iron/30 p-4">
          <Input
            placeholder={activeTab === 'templates' ? 'Search templates...' : 'Search logs...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-deep-carbon border-iron/30 text-pure-white max-w-sm"
          />
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block size-6 animate-spin rounded-full border-2 border-iron border-t-signal-red" />
            <p className="mt-2 text-sm text-steel">Loading...</p>
          </div>
        ) : activeTab === 'templates' ? (
          filteredTemplates.length === 0 ? (
            <EmptyState
              title="No templates"
              description={search ? 'No templates match your search.' : 'No email templates found.'}
              icon={Mail}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-iron/30 text-left text-xs font-medium uppercase tracking-wider text-steel">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Key</th>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">Active</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-iron/30">
                  {filteredTemplates.map((item) => (
                    <tr key={item.id} className="hover:bg-deep-carbon/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-pure-white">{item.name}</td>
                      <td className="px-4 py-3 text-sm font-mono text-steel">{item.key}</td>
                      <td className="px-4 py-3 text-sm text-steel">{item.subject ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${item.isActive ? 'bg-green-500/10 text-green-400' : 'bg-iron/30 text-steel'}`}>
                          {item.isActive ? 'Active' : 'Inactive'}
                        </span>
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
          )
        ) : filteredLogs.length === 0 ? (
          <EmptyState
            title="No logs"
            description={search ? 'No logs match your search.' : 'No email logs found.'}
            icon={ScrollText}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-iron/30 text-left text-xs font-medium uppercase tracking-wider text-steel">
                  <th className="px-4 py-3">Recipient</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Error</th>
                  <th className="px-4 py-3">Sent At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-iron/30">
                {filteredLogs.map((item) => (
                  <tr key={item.id} className="hover:bg-deep-carbon/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-pure-white">{item.recipient}</td>
                    <td className="px-4 py-3 text-sm text-steel">{item.subject ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${item.status === 'sent' ? 'bg-green-500/10 text-green-400' : item.status === 'failed' ? 'bg-signal-red/10 text-signal-red' : 'bg-yellow-500/10 text-yellow-400'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-signal-red max-w-[200px] truncate">{item.errorMessage ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-steel">{item.sentAt ? new Date(item.sentAt).toLocaleString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-carbon border-iron max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-pure-white">
              {editing ? 'Edit Template' : 'New Template'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField name="name" label="Name" required>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Order Confirmation"
                  className="bg-deep-carbon border-iron/30 text-pure-white"
                />
              </FormField>
              <FormField name="key" label="Key" required>
                <Input
                  value={form.key}
                  onChange={(e) => setForm((f) => ({ ...f, key: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                  placeholder="order_confirmation"
                  className="bg-deep-carbon border-iron/30 text-pure-white"
                />
              </FormField>
            </div>
            <FormField name="description" label="Description">
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Sent when an order is confirmed"
                className="bg-deep-carbon border-iron/30 text-pure-white"
              />
            </FormField>
            <FormField name="subject" label="Subject Line">
              <Input
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                placeholder="Your order {{orderNumber}} has been confirmed"
                className="bg-deep-carbon border-iron/30 text-pure-white"
              />
            </FormField>
            <FormField name="body" label="HTML Body">
              <textarea
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                placeholder="<h1>Order Confirmed</h1><p>Thank you for your order...</p>"
                rows={10}
                className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white font-mono"
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.name.trim() || !form.key.trim()}>
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Delete Template"
        description={`Are you sure you want to delete "${deleteTarget?.name}"?`}
        variant="destructive"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}

export { EmailClient };
