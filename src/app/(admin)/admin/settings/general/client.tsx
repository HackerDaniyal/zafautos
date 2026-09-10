'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/admin/forms/form-field';

function GeneralSettingsClient() {
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  return (
    <div className="space-y-6">
      <div className="rounded-[10px] border border-iron/30 bg-carbon p-6">
        <h2 className="text-lg font-semibold text-pure-white">General Settings</h2>
        <p className="mt-1 text-sm text-ash">Basic platform configuration</p>
        
        <div className="mt-6 space-y-4 max-w-lg">
          <FormField name="siteName" label="Site Name">
            <Input defaultValue="ZafAutos Japan" className="bg-deep-carbon border-iron/30 text-pure-white" />
          </FormField>
          <FormField name="siteUrl" label="Site URL">
            <Input defaultValue="https://zafautos.com" className="bg-deep-carbon border-iron/30 text-pure-white" />
          </FormField>
          <FormField name="supportEmail" label="Support Email">
            <Input defaultValue="support@zafautos.com" className="bg-deep-carbon border-iron/30 text-pure-white" />
          </FormField>
          <Button className="bg-signal-red text-pure-white hover:bg-deep-red">
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}

export { GeneralSettingsClient };
