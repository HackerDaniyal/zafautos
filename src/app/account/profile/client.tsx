'use client';

import { useState } from 'react';
import { updateMyProfile } from '@/server/actions/accountActions';
import { Button } from '@/components/ui/button';

export function ProfileClient({ profile }: { profile: any }) {
  const [firstName, setFirstName] = useState(profile?.firstName || '');
  const [lastName, setLastName] = useState(profile?.lastName || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await updateMyProfile({ firstName, lastName, phone });
      setSaved(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  if (!profile) {
    return (
      <div className="rounded-[10px] border border-iron/10 bg-deep-carbon p-12 text-center">
        <p className="text-sm text-steel">Could not load profile</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Email (read-only) */}
      <div className="rounded-[10px] border border-iron/10 bg-deep-carbon p-5">
        <h2 className="text-sm font-semibold text-pure-white mb-3">Account</h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-steel">Email</label>
            <p className="mt-1 text-sm text-pure-white">{profile.email}</p>
          </div>
        </div>
      </div>

      {/* Personal info */}
      <div className="rounded-[10px] border border-iron/10 bg-deep-carbon p-5">
        <h2 className="text-sm font-semibold text-pure-white mb-3">Personal Information</h2>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs text-steel">First Name</label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-1 w-full rounded-[6px] border border-iron/30 bg-race-black px-3 py-2.5 text-sm text-pure-white placeholder:text-steel focus:outline-none focus:ring-1 focus:ring-signal-red"
              />
            </div>
            <div>
              <label className="text-xs text-steel">Last Name</label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-1 w-full rounded-[6px] border border-iron/30 bg-race-black px-3 py-2.5 text-sm text-pure-white placeholder:text-steel focus:outline-none focus:ring-1 focus:ring-signal-red"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-steel">Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-[6px] border border-iron/30 bg-race-black px-3 py-2.5 text-sm text-pure-white placeholder:text-steel focus:outline-none focus:ring-1 focus:ring-signal-red"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
        {saved && <p className="text-sm text-emerald-400">Profile updated</p>}
      </div>
    </form>
  );
}
