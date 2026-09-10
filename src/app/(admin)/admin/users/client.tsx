'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, MoreHorizontal, Shield, ShieldOff, UserX, Mail, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  updateUserStatus,
  deleteUser,
  adminResetPassword,
  resendInvitation,
  inviteUser,
} from '@/server/actions/adminActions';

interface UserRow {
  id: string;
  email: string;
  role: string;
  status: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: Date;
}

interface UserManagementClientProps {
  users: UserRow[];
  total: number;
  page: number;
  totalPages: number;
  roleFilter?: string;
  statusFilter?: string;
  currentUserId: string;
  callerRole: string;
}

const ROLE_LABELS: Record<string, string> = {
  customer: 'Customer',
  dealer: 'Dealer',
  admin: 'Admin',
  super_admin: 'Super Admin',
};

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-available-green/10 text-available-green',
  pending: 'bg-auction-amber/10 text-auction-amber',
  suspended: 'bg-destructive/10 text-destructive',
  blocked: 'bg-sold-gray/20 text-steel',
};

export function UserManagementClient({
  users,
  total,
  page,
  totalPages,
  roleFilter,
  statusFilter,
  currentUserId,
  callerRole,
}: UserManagementClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [showInvite, setShowInvite] = React.useState(false);

  function buildUrl(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    if (updates.role !== undefined || updates.status !== undefined) {
      params.set('page', '1');
    }
    return `/admin/users?${params.toString()}`;
  }

  async function handleAction(action: string, userId: string) {
    setActionLoading(userId);
    try {
      switch (action) {
        case 'suspend':
          await updateUserStatus(userId, 'suspended');
          break;
        case 'activate':
          await updateUserStatus(userId, 'active');
          break;
        case 'block':
          await updateUserStatus(userId, 'blocked');
          break;
        case 'delete':
          if (confirm('Are you sure you want to delete this user? This cannot be undone.')) {
            await deleteUser(userId);
          }
          break;
        case 'reset-password':
          await adminResetPassword(userId);
          alert('Password reset email sent.');
          break;
        case 'resend-invite':
          await resendInvitation(userId);
          alert('Invitation resent.');
          break;
      }
      router.refresh();
    } catch {
      alert('Action failed.');
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-ash">Role:</span>
          {['', 'customer', 'dealer', 'admin', 'super_admin'].map((r) => (
            <a
              key={r}
              href={buildUrl({ role: r || undefined })}
              className={cn(
                'rounded-md px-2 py-1 text-xs transition-colors',
                roleFilter === r || (!roleFilter && !r)
                  ? 'bg-signal-red/10 text-signal-red'
                  : 'text-ash hover:text-pure-white'
              )}
            >
              {r ? ROLE_LABELS[r] : 'All'}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-ash">Status:</span>
          {['', 'active', 'pending', 'suspended', 'blocked'].map((s) => (
            <a
              key={s}
              href={buildUrl({ status: s || undefined })}
              className={cn(
                'rounded-md px-2 py-1 text-xs transition-colors',
                statusFilter === s || (!statusFilter && !s)
                  ? 'bg-signal-red/10 text-signal-red'
                  : 'text-ash hover:text-pure-white'
              )}
            >
              {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
            </a>
          ))}
        </div>
        <div className="ml-auto">
          <Button size="sm" onClick={() => setShowInvite(!showInvite)}>
            {showInvite ? 'Cancel' : 'Invite User'}
          </Button>
        </div>
      </div>

      {/* Invite Form */}
      {showInvite && <InviteForm onDone={() => { setShowInvite(false); router.refresh(); }} />}

      {/* User Table */}
      <div className="rounded-lg border border-iron/30 bg-carbon overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-iron/30 text-left text-xs text-steel uppercase tracking-wider">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-iron/20 hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-pure-white">
                        {u.firstName} {u.lastName}
                      </p>
                      <p className="text-xs text-steel">{u.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-ash">{ROLE_LABELS[u.role] ?? u.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex rounded px-2 py-0.5 text-xs font-medium', STATUS_STYLES[u.status] ?? '')}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-steel">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {actionLoading === u.id ? (
                        <Loader2 className="size-4 animate-spin text-steel" />
                      ) : (
                        <>
                          {u.id !== currentUserId && (
                            <>
                              {u.status === 'active' ? (
                                <ActionBtn icon={<ShieldOff className="size-3.5" />} label="Suspend" onClick={() => handleAction('suspend', u.id)} />
                              ) : (
                                <ActionBtn icon={<Shield className="size-3.5" />} label="Activate" onClick={() => handleAction('activate', u.id)} />
                              )}
                              {u.status === 'pending' && (
                                <ActionBtn icon={<Mail className="size-3.5" />} label="Resend Invite" onClick={() => handleAction('resend-invite', u.id)} />
                              )}
                              <ActionBtn icon={<UserX className="size-3.5" />} label="Reset Password" onClick={() => handleAction('reset-password', u.id)} />
                              {callerRole === 'super_admin' && (
                                <ActionBtn icon={<Trash2 className="size-3.5" />} label="Delete" onClick={() => handleAction('delete', u.id)} danger />
                              )}
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-steel">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-ash">
            Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <a href={buildUrl({ page: String(Math.max(1, page - 1)) })}>
              <Button variant="outline" size="sm" disabled={page <= 1}><ChevronLeft className="size-4" /></Button>
            </a>
            <span className="text-sm text-ash">Page {page} of {totalPages}</span>
            <a href={buildUrl({ page: String(Math.min(totalPages, page + 1)) })}>
              <Button variant="outline" size="sm" disabled={page >= totalPages}><ChevronRight className="size-4" /></Button>
            </a>
          </div>
        </div>
      )}
    </>
  );
}

function ActionBtn({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={cn(
        'inline-flex size-7 items-center justify-center rounded transition-colors',
        danger
          ? 'text-steel hover:bg-destructive/10 hover:text-destructive'
          : 'text-steel hover:bg-white/5 hover:text-pure-white'
      )}
    >
      {icon}
    </button>
  );
}

function InviteForm({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = React.useState('');
  const [role, setRole] = React.useState<'dealer' | 'admin'>('dealer');
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await inviteUser({ email, role, firstName, lastName });
      if (!result.success) {
        setError(result.error);
        return;
      }
      onDone();
    } catch {
      setError('Failed to send invitation.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-iron/30 bg-carbon p-4 space-y-4">
      <h3 className="text-sm font-medium text-pure-white">Invite User</h3>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="grid grid-cols-2 gap-4">
        <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" className="h-9 rounded-[6px] border border-iron bg-deep-carbon px-3 text-sm text-pure-white placeholder:text-steel focus-visible:border-signal-red outline-none" />
        <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" className="h-9 rounded-[6px] border border-iron bg-deep-carbon px-3 text-sm text-pure-white placeholder:text-steel focus-visible:border-signal-red outline-none" />
      </div>
      <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email address" required className="h-9 w-full rounded-[6px] border border-iron bg-deep-carbon px-3 text-sm text-pure-white placeholder:text-steel focus-visible:border-signal-red outline-none" />
      <select value={role} onChange={(e) => setRole(e.target.value as 'dealer' | 'admin')} className="h-9 rounded-[6px] border border-iron bg-deep-carbon px-3 text-sm text-pure-white focus-visible:border-signal-red outline-none">
        <option value="dealer">Dealer</option>
        <option value="admin">Admin</option>
      </select>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onDone}>Cancel</Button>
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? <><Loader2 className="size-3.5 animate-spin" /> Sending...</> : 'Send Invitation'}
        </Button>
      </div>
    </form>
  );
}
