'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, ShoppingCart, CreditCard, Truck, MessageSquare, Users, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/admin/ui/page-header';
import {
  listNotificationRules,
  seedDefaultNotificationRules,
  updateNotificationRule,
  bulkUpdateNotificationRules,
} from '@/server/actions/notificationActions';

interface NotificationRule {
  id: string;
  eventType: string;
  label: string;
  description: string | null;
  isEnabled: boolean;
  sendInApp: boolean;
  sendEmail: boolean;
}

const eventGroups = [
  { label: 'Orders', icon: ShoppingCart, events: ['order.created', 'order.confirmed', 'order.shipped', 'order.delivered', 'order.cancelled'] },
  { label: 'Payments', icon: CreditCard, events: ['payment.received', 'payment.failed', 'payment.refunded'] },
  { label: 'Shipping', icon: Truck, events: ['shipping.updated'] },
  { label: 'Enquiries', icon: MessageSquare, events: ['enquiry.received'] },
  { label: 'Users', icon: Users, events: ['user.registered', 'user.invited'] },
];

function NotificationsClient() {
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listNotificationRules();
      if (result.success) {
        setRules(result.data as NotificationRule[]);
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

  async function handleSeedDefaults() {
    try {
      const result = await seedDefaultNotificationRules();
      if (result.success) {
        const data = result.data as { created: number };
        setFeedback({ type: 'success', message: `Seeded ${data.created} default rules` });
        await fetchData();
      } else {
        setFeedback({ type: 'error', message: result.error ?? 'Failed to seed' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to seed' });
    }
  }

  async function handleToggle(id: string, field: 'isEnabled' | 'sendInApp' | 'sendEmail') {
    const rule = rules.find((r) => r.id === id);
    if (!rule) return;

    const newValue = !rule[field];
    setRules((prev) => prev.map((r) => r.id === id ? { ...r, [field]: newValue } : r));

    try {
      const result = await updateNotificationRule(id, { [field]: newValue });
      if (!result.success) {
        setRules((prev) => prev.map((r) => r.id === id ? { ...r, [field]: !newValue } : r));
        setFeedback({ type: 'error', message: result.error ?? 'Failed to update' });
      }
    } catch {
      setRules((prev) => prev.map((r) => r.id === id ? { ...r, [field]: !newValue } : r));
      setFeedback({ type: 'error', message: 'Failed to update' });
    }
  }

  async function handleBulkToggle(field: 'isEnabled' | 'sendInApp' | 'sendEmail', value: boolean) {
    setSaving(true);
    try {
      const updates = rules.map((r) => ({ id: r.id, [field]: value }));
      const result = await bulkUpdateNotificationRules(updates);
      if (result.success) {
        setRules((prev) => prev.map((r) => ({ ...r, [field]: value })));
        setFeedback({ type: 'success', message: `All ${field === 'isEnabled' ? 'rules' : field === 'sendInApp' ? 'in-app notifications' : 'email notifications'} ${value ? 'enabled' : 'disabled'}` });
      } else {
        setFeedback({ type: 'error', message: result.error ?? 'Failed to update' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to update' });
    } finally {
      setSaving(false);
    }
  }

  function getRuleForEvent(eventType: string) {
    return rules.find((r) => r.eventType === eventType);
  }

  if (loading) {
    return (
      <div className="rounded-[10px] border border-iron/30 bg-carbon p-8 text-center">
        <div className="inline-block size-6 animate-spin rounded-full border-2 border-iron border-t-signal-red" />
        <p className="mt-2 text-sm text-steel">Loading notification rules...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Notification Settings" description="Configure which events trigger notifications and their delivery channels">
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleSeedDefaults}>
            <RefreshCw className="mr-1 size-4" />
            Seed Defaults
          </Button>
        </div>
      </PageHeader>

      {feedback && (
        <div className={`rounded-[6px] px-4 py-3 text-sm ${feedback.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-signal-red/10 text-signal-red border border-signal-red/30'}`}>
          {feedback.message}
        </div>
      )}

      {rules.length === 0 ? (
        <div className="rounded-[10px] border border-iron/30 bg-carbon p-8 text-center">
          <Bell className="mx-auto size-8 text-steel mb-3" />
          <p className="text-ash mb-4">No notification rules configured yet.</p>
          <Button onClick={handleSeedDefaults} className="bg-signal-red text-pure-white hover:bg-deep-red">
            <RefreshCw className="mr-1 size-4" />
            Seed Default Rules
          </Button>
        </div>
      ) : (
        <>
          <div className="rounded-[10px] border border-iron/30 bg-carbon p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-ash">Quick actions</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleBulkToggle('isEnabled', true)} disabled={saving}>Enable All</Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkToggle('isEnabled', false)} disabled={saving}>Disable All</Button>
              </div>
            </div>
          </div>

          {eventGroups.map((group) => {
            const Icon = group.icon;
            return (
              <div key={group.label} className="rounded-[10px] border border-iron/30 bg-carbon">
                <div className="border-b border-iron/30 px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Icon className="size-5 text-signal-red" />
                    <h3 className="text-sm font-semibold text-pure-white">{group.label}</h3>
                  </div>
                </div>
                <div className="divide-y divide-iron/30">
                  {group.events.map((eventType) => {
                    const rule = getRuleForEvent(eventType);
                    if (!rule) return null;
                    return (
                      <div key={eventType} className="flex items-center justify-between px-6 py-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-pure-white">{rule.label}</p>
                          {rule.description && <p className="text-xs text-steel mt-0.5">{rule.description}</p>}
                        </div>
                        <div className="flex items-center gap-6 ml-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggle(rule.id, 'isEnabled')}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${rule.isEnabled ? 'bg-signal-red' : 'bg-iron/50'}`}
                            >
                              <span className={`pointer-events-none inline-block size-5 rounded-full bg-white shadow-lg transition-transform ${rule.isEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                            <span className="text-xs text-steel w-12">{rule.isEnabled ? 'On' : 'Off'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggle(rule.id, 'sendInApp')}
                              disabled={!rule.isEnabled}
                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${rule.sendInApp && rule.isEnabled ? 'bg-signal-red' : 'bg-iron/50'} ${!rule.isEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              <span className={`pointer-events-none inline-block size-4 rounded-full bg-white shadow-lg transition-transform ${rule.sendInApp ? 'translate-x-4' : 'translate-x-0'}`} />
                            </button>
                            <span className="text-xs text-steel w-16">In-App</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggle(rule.id, 'sendEmail')}
                              disabled={!rule.isEnabled}
                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${rule.sendEmail && rule.isEnabled ? 'bg-signal-red' : 'bg-iron/50'} ${!rule.isEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              <span className={`pointer-events-none inline-block size-4 rounded-full bg-white shadow-lg transition-transform ${rule.sendEmail ? 'translate-x-4' : 'translate-x-0'}`} />
                            </button>
                            <span className="text-xs text-steel w-12">Email</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

export { NotificationsClient };
