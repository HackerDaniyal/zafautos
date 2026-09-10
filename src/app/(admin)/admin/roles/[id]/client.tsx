'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  getRole,
  getPermissionGroups,
  assignPermissions,
} from '@/server/actions/roleActions';

interface RoleDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  userCount: number;
  permissionIds: string[];
  isSystem: boolean;
}

interface Permission {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

interface PermissionGroup {
  group: string;
  permissions: Permission[];
}

interface RoleDetailClientProps {
  roleId: string;
}

export function RoleDetailClient({ roleId }: RoleDetailClientProps) {
  const router = useRouter();
  const [role, setRole] = useState<RoleDetail | null>(null);
  const [groups, setGroups] = useState<PermissionGroup[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [roleResult, groupsResult] = await Promise.all([
        getRole(roleId),
        getPermissionGroups(),
      ]);

      if (roleResult.success) {
        const r = roleResult.data as RoleDetail;
        setRole(r);
        setSelected(new Set(r.permissionIds));
      } else {
        setFeedback({ type: 'error', message: roleResult.error ?? 'Failed to load role' });
        return;
      }

      if (groupsResult.success) {
        setGroups(groupsResult.data as PermissionGroup[]);
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  }, [roleId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  function togglePermission(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleGroup(permIds: string[]) {
    setSelected((prev) => {
      const next = new Set(prev);
      const allSelected = permIds.every((id) => next.has(id));
      if (allSelected) {
        permIds.forEach((id) => next.delete(id));
      } else {
        permIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const result = await assignPermissions(roleId, Array.from(selected));
      if (!result.success) {
        setFeedback({ type: 'error', message: result.error ?? 'Failed to save permissions' });
        return;
      }
      setFeedback({ type: 'success', message: 'Permissions saved' });
      fetchData();
    } catch {
      setFeedback({ type: 'error', message: 'Failed to save' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-steel" />
      </div>
    );
  }

  if (!role) {
    return (
      <div className="rounded-[10px] border border-iron/30 bg-carbon p-8 text-center">
        <p className="text-ash">Role not found.</p>
      </div>
    );
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

      {/* Role Info */}
      <div className="rounded-[10px] border border-iron/30 bg-carbon p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-pure-white">{role.name}</h2>
            <p className="text-xs text-steel font-mono">{role.slug}</p>
            {role.description && <p className="mt-1 text-sm text-ash">{role.description}</p>}
          </div>
          <div className="text-right text-xs text-steel">
            <p>{role.userCount} user{role.userCount !== 1 ? 's' : ''}</p>
            <p>{selected.size} permission{selected.size !== 1 ? 's' : ''} assigned</p>
          </div>
        </div>
      </div>

      {/* Permission Matrix */}
      <div className="space-y-4">
        {groups.map((group) => {
          const groupIds = group.permissions.map((p) => p.id);
          const allSelected = groupIds.every((id) => selected.has(id));
          const someSelected = groupIds.some((id) => selected.has(id)) && !allSelected;

          return (
            <div key={group.group} className="rounded-[10px] border border-iron/30 bg-carbon overflow-hidden">
              <div className="flex items-center justify-between border-b border-iron/20 px-4 py-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleGroup(groupIds)}
                    className={cn(
                      'flex size-5 items-center justify-center rounded border transition-colors',
                      allSelected
                        ? 'border-signal-red bg-signal-red text-pure-white'
                        : someSelected
                          ? 'border-signal-red bg-signal-red/20 text-signal-red'
                          : 'border-iron bg-transparent text-transparent hover:border-steel'
                    )}
                  >
                    {(allSelected || someSelected) && <Check className="size-3" />}
                  </button>
                  <h3 className="text-sm font-semibold text-pure-white">{group.group}</h3>
                </div>
                <span className="text-xs text-steel">
                  {groupIds.filter((id) => selected.has(id)).length}/{groupIds.length}
                </span>
              </div>
              <div className="divide-y divide-iron/10">
                {group.permissions.map((perm) => (
                  <label
                    key={perm.id}
                    className="flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-white/[0.02] transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(perm.id)}
                      onChange={() => togglePermission(perm.id)}
                      className="sr-only"
                    />
                    <div
                      className={cn(
                        'flex size-4 items-center justify-center rounded border transition-colors',
                        selected.has(perm.id)
                          ? 'border-signal-red bg-signal-red text-pure-white'
                          : 'border-iron bg-transparent text-transparent hover:border-steel'
                      )}
                    >
                      {selected.has(perm.id) && <Check className="size-2.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-pure-white">{perm.name}</span>
                      <span className="ml-2 text-xs text-steel font-mono">{perm.slug}</span>
                    </div>
                    {perm.description && (
                      <span className="text-xs text-steel truncate max-w-xs">{perm.description}</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving || role.isSystem}>
          {saving ? <Loader2 className="mr-2 size-3.5 animate-spin" /> : <Save className="mr-2 size-3.5" />}
          Save Permissions
        </Button>
      </div>
    </>
  );
}
