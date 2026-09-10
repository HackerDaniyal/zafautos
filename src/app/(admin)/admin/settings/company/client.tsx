'use client';

import { useState, useEffect, useCallback } from 'react';
import { Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/admin/forms/form-field';
import { PageHeader } from '@/components/admin/ui/page-header';
import { getCompanySettings, updateCompanySettings } from '@/server/actions/companyActions';

interface CompanyData {
  companyName?: string;
  companyEmail?: string;
  companyPhone?: string;
  website?: string;
  address?: { street?: string; city?: string; state?: string; postalCode?: string; country?: string };
  taxId?: string;
  registrationNumber?: string;
  logoUrl?: string;
  faviconUrl?: string;
}

function CompanyClient() {
  const [form, setForm] = useState<CompanyData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getCompanySettings();
      if (result.success && result.data) {
        setForm(result.data as CompanyData);
      }
    } catch {
      // Silently handle - form stays empty
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

  async function handleSave() {
    if (!form.companyName?.trim()) {
      setFeedback({ type: 'error', message: 'Company name is required' });
      return;
    }
    setSaving(true);
    try {
      const result = await updateCompanySettings(form);
      if (result.success) {
        setFeedback({ type: 'success', message: 'Company settings saved' });
      } else {
        setFeedback({ type: 'error', message: result.error ?? 'Failed to save' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to save' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-[10px] border border-iron/30 bg-carbon p-8 text-center">
        <div className="inline-block size-6 animate-spin rounded-full border-2 border-iron border-t-signal-red" />
        <p className="mt-2 text-sm text-steel">Loading company settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Company Settings" description="Manage your company profile and registration details" />

      {feedback && (
        <div className={`rounded-[6px] px-4 py-3 text-sm ${feedback.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-signal-red/10 text-signal-red border border-signal-red/30'}`}>
          {feedback.message}
        </div>
      )}

      <div className="rounded-[10px] border border-iron/30 bg-carbon p-6">
        <div className="flex items-center gap-2 mb-6">
          <Building2 className="size-5 text-signal-red" />
          <h2 className="text-lg font-semibold text-pure-white">Basic Information</h2>
        </div>
        <div className="space-y-4 max-w-lg">
          <FormField name="companyName" label="Company Name" required>
            <Input
              value={form.companyName ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
              placeholder="ZafAutos Japan"
              className="bg-deep-carbon border-iron/30 text-pure-white"
            />
          </FormField>
          <FormField name="companyEmail" label="Company Email">
            <Input
              type="email"
              value={form.companyEmail ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, companyEmail: e.target.value }))}
              placeholder="info@zafautos.com"
              className="bg-deep-carbon border-iron/30 text-pure-white"
            />
          </FormField>
          <FormField name="companyPhone" label="Company Phone">
            <Input
              value={form.companyPhone ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, companyPhone: e.target.value }))}
              placeholder="+81-3-1234-5678"
              className="bg-deep-carbon border-iron/30 text-pure-white"
            />
          </FormField>
          <FormField name="website" label="Website URL">
            <Input
              value={form.website ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
              placeholder="https://zafautos.com"
              className="bg-deep-carbon border-iron/30 text-pure-white"
            />
          </FormField>
        </div>
      </div>

      <div className="rounded-[10px] border border-iron/30 bg-carbon p-6">
        <h2 className="text-lg font-semibold text-pure-white mb-6">Address</h2>
        <div className="space-y-4 max-w-lg">
          <FormField name="street" label="Street Address">
            <Input
              value={form.address?.street ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, address: { ...f.address, street: e.target.value } }))}
              placeholder="1-2-3 Shibuya"
              className="bg-deep-carbon border-iron/30 text-pure-white"
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField name="city" label="City">
              <Input
                value={form.address?.city ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, address: { ...f.address, city: e.target.value } }))}
                placeholder="Tokyo"
                className="bg-deep-carbon border-iron/30 text-pure-white"
              />
            </FormField>
            <FormField name="state" label="State/Prefecture">
              <Input
                value={form.address?.state ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, address: { ...f.address, state: e.target.value } }))}
                placeholder="Tokyo"
                className="bg-deep-carbon border-iron/30 text-pure-white"
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField name="postalCode" label="Postal Code">
              <Input
                value={form.address?.postalCode ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, address: { ...f.address, postalCode: e.target.value } }))}
                placeholder="150-0001"
                className="bg-deep-carbon border-iron/30 text-pure-white"
              />
            </FormField>
            <FormField name="country" label="Country">
              <Input
                value={form.address?.country ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, address: { ...f.address, country: e.target.value } }))}
                placeholder="Japan"
                className="bg-deep-carbon border-iron/30 text-pure-white"
              />
            </FormField>
          </div>
        </div>
      </div>

      <div className="rounded-[10px] border border-iron/30 bg-carbon p-6">
        <h2 className="text-lg font-semibold text-pure-white mb-6">Registration</h2>
        <div className="space-y-4 max-w-lg">
          <FormField name="taxId" label="Tax ID / Registration Number">
            <Input
              value={form.taxId ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, taxId: e.target.value }))}
              placeholder="T1234567890123"
              className="bg-deep-carbon border-iron/30 text-pure-white"
            />
          </FormField>
          <FormField name="registrationNumber" label="Business Registration Number">
            <Input
              value={form.registrationNumber ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, registrationNumber: e.target.value }))}
              placeholder="0100-01-123456"
              className="bg-deep-carbon border-iron/30 text-pure-white"
            />
          </FormField>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving || !form.companyName?.trim()} className="bg-signal-red text-pure-white hover:bg-deep-red">
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}

export { CompanyClient };
