'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Users, Shield, Loader2, Trash2, Settings } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import {
  listRoles,
  createRole,
  updateRole,
  deleteRole,
} from '@/server/actions/roleActions';

interface RoleRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  userCount: number;
  permissionCount: number;
  isSystem?: boolean;
  createdAt: string;
}

const defaultForm = {
  name: '',
  slug: '',
  description: '',
};

const SYSTEM_ROLES = ['super_admin', 'admin', 'dealer', 'customer'];

function isSystemRole(slug: string): boolean {
  return SYSTEM_ROLES.includes(slug);
}

export function RolesListClient() {
  const router = useRouter();
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RoleRow | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RoleRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listRoles();
      if (result.success) {
        setRoles(result.data as RoleRow[]);
      } else {
        setFeedback({ type: 'error', message: result.error ?? 'Failed to load roles' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to load roles' });
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
    setForm(defaultForm);
    setDialogOpen(true);
  }

  function openEdit(role: RoleRow) {
    if (isSystemRole(role.slug)) return;
    setEditing(role);
    setForm({ name: role.name, slug: role.slug, description: role.description ?? '' });
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editing) {
        const result = await updateRole(editing.id, {
          name: form.name,
          description: form.description || undefined,
        });
        if (!result.success) {
          setFeedback({ type: 'error', message: result.error ?? 'Failed to update role' });
          return;
        }
      } else {
        const result = await createRole({
          name: form.name,
          slug: form.slug,
          description: form.description || undefined,
        });
        if (!result.success) {
          setFeedback({ type: 'error', message: result.error ?? 'Failed to create role' });
          return;
        }
      }
      setDialogOpen(false);
      setFeedback({ type: 'success', message: editing ? 'Role updated' : 'Role created' });
      fetchData();
    } catch {
      setFeedback({ type: 'error', message: 'Operation failed' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const result = await deleteRole(deleteTarget.id);
      if (!result.success) {
        setFeedback({ type: 'error', message: result.error ?? 'Failed to delete role' });
        return;
      }
      setDeleteTarget(null);
      setFeedback({ type: 'success', message: 'Role deleted' });
      fetchData();
    } catch {
      setFeedback({ type: 'error', message: 'Failed to delete role' });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      {/* Feedback */}
      {feedback && (
        <div
          className={cn(
            'rounded-[6px] px-4 py-2 text-sm',
            feedback.type === 'success'
              ? 'bg-available-green/10 text-available-green'
              : 'bg-destructive/10 text-destructive'
          )}
        >
          {feedback.message}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-ash">{roles.length} role{roles.length !== 1 ? 's' : ''}</p>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-2 size-4" /> Create Role
        </Button>
      </div>

      {/* Role Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-steel" />
        </div>
      ) : roles.length === 0 ? (
        <EmptyState title="No roles" description="Create your first custom role to get started." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {roles.map((role) => {
            const system = isSystemRole(role.slug);
            return (
              <div
                key={role.id}
                className={cn(
                  'rounded-[10px] border bg-carbon p-4 transition-colors',
                  system ? 'border-iron/20 opacity-60' : 'border-iron/30 hover:border-iron/50'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-pure-white">{role.name}</h3>
                      {system && (
                        <span className="rounded bg-iron/30 px-1.5 py-0.5 text-[10px] text-steel uppercase">
                          System
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-steel font-mono">{role.slug}</p>
                    {role.description && (
                      <p className="text-xs text-ash line-clamp-2">{role.description}</p>
                    )}
                  </div>
                  {!system && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(role)}
                        className="inline-flex size-7 items-center justify-center rounded text-steel hover:bg-white/5 hover:text-pure-white"
                        title="Edit"
                      >
                        <Settings className="size-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(role)}
                        className="inline-flex size-7 items-center justify-center rounded text-steel hover:bg-destructive/10 hover:text-destructive"
                        title="Delete"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-steel">
                  <span className="flex items-center gap-1">
                    <Users className="size-3.5" /> {role.userCount} user{role.userCount !== 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <Shield className="size-3.5" /> {role.permissionCount} permission{role.permissionCount !== 1 ? 's' : ''}
                  </span>
                </div>
                {!system && (
                  <div className="mt-3">
                    <a
                      href={`/admin/roles/${role.id}`}
                      className="text-xs text-signal-red hover:underline"
                    >
                      Manage permissions →
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Role' : 'Create Role'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <FormField name="name" label="Name" required>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Moderator"
              />
            </FormField>
            {!editing && (
              <FormField name="slug" label="Slug" required description="URL-safe identifier. Letters, numbers, and hyphens only.">
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  placeholder="e.g. moderator"
                />
              </FormField>
            )}
            <FormField name="description" label="Description">
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional description"
              />
            </FormField>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !form.name || (!editing && !form.slug)}>
              {saving ? <Loader2 className="mr-2 size-3.5 animate-spin" /> : null}
              {editing ? 'Save Changes' : 'Create Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete Role"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  );
}
