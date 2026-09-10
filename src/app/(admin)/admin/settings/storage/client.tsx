'use client';

import { useState, useEffect, useCallback } from 'react';
import { HardDrive, Upload, Globe, Lock, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/admin/forms/form-field';
import { PageHeader } from '@/components/admin/ui/page-header';
import { getStorageOverview, getStorageConfig, updateStorageConfig } from '@/server/actions/storageActions';

interface BucketInfo {
  name: string;
  description: string;
  publicAccess: boolean;
  allowedTypes: string[];
  maxSizeMB: number;
}

interface StorageConfig {
  maxFileSizeMB: number;
  allowedMimeTypes: string[];
  cdnUrl: string | null;
  enableImageOptimization: boolean;
}

const ALL_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
  'application/pdf', 'text/csv', 'application/json', 'video/mp4',
];

function StorageClient() {
  const [buckets, setBuckets] = useState<BucketInfo[]>([]);
  const [config, setConfig] = useState<StorageConfig>({ maxFileSizeMB: 10, allowedMimeTypes: [], cdnUrl: null, enableImageOptimization: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [bucketsResult, configResult] = await Promise.all([getStorageOverview(), getStorageConfig()]);
      if (bucketsResult.success) setBuckets(bucketsResult.data as BucketInfo[]);
      if (configResult.success && configResult.data) setConfig(configResult.data as StorageConfig);
    } catch {
      // Silently handle
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

  function toggleMimeType(type: string) {
    setConfig((c) => {
      const current = c.allowedMimeTypes;
      const next = current.includes(type) ? current.filter((t) => t !== type) : [...current, type];
      return { ...c, allowedMimeTypes: next };
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const result = await updateStorageConfig({
        ...config,
        cdnUrl: config.cdnUrl ?? undefined,
      });
      if (result.success) {
        setFeedback({ type: 'success', message: 'Storage config saved' });
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
        <p className="mt-2 text-sm text-steel">Loading storage settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Storage Settings" description="Monitor storage buckets and configure upload limits" />

      {feedback && (
        <div className={`rounded-[6px] px-4 py-3 text-sm ${feedback.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-signal-red/10 text-signal-red border border-signal-red/30'}`}>
          {feedback.message}
        </div>
      )}

      <div className="rounded-[10px] border border-iron/30 bg-carbon p-6">
        <div className="flex items-center gap-2 mb-6">
          <HardDrive className="size-5 text-signal-red" />
          <h2 className="text-lg font-semibold text-pure-white">Storage Buckets</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {buckets.map((bucket) => (
            <div key={bucket.name} className="rounded-[8px] border border-iron/30 bg-deep-carbon p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-pure-white">{bucket.name}</h3>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${bucket.publicAccess ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                  {bucket.publicAccess ? <Globe className="size-3" /> : <Lock className="size-3" />}
                  {bucket.publicAccess ? 'Public' : 'Private'}
                </span>
              </div>
              <p className="text-xs text-steel mb-3">{bucket.description}</p>
              <div className="space-y-1">
                <p className="text-xs text-ash">Max size: <span className="text-pure-white">{bucket.maxSizeMB}MB</span></p>
                <p className="text-xs text-ash">Types: <span className="text-pure-white">{bucket.allowedTypes.length} MIME types</span></p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[10px] border border-iron/30 bg-carbon p-6">
        <div className="flex items-center gap-2 mb-6">
          <Upload className="size-5 text-signal-red" />
          <h2 className="text-lg font-semibold text-pure-white">Upload Configuration</h2>
        </div>
        <div className="space-y-4 max-w-lg">
          <FormField name="maxFileSizeMB" label="Max File Size (MB)">
            <Input
              type="number"
              min="1"
              max="100"
              value={config.maxFileSizeMB}
              onChange={(e) => setConfig((c) => ({ ...c, maxFileSizeMB: parseInt(e.target.value) || 10 }))}
              className="bg-deep-carbon border-iron/30 text-pure-white"
            />
          </FormField>
          <FormField name="cdnUrl" label="CDN Base URL (optional)">
            <Input
              value={config.cdnUrl ?? ''}
              onChange={(e) => setConfig((c) => ({ ...c, cdnUrl: e.target.value || null }))}
              placeholder="https://cdn.zafautos.com"
              className="bg-deep-carbon border-iron/30 text-pure-white"
            />
          </FormField>
          <FormField name="enableImageOptimization" label="Image Optimization">
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfig((c) => ({ ...c, enableImageOptimization: !c.enableImageOptimization }))}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${config.enableImageOptimization ? 'bg-signal-red' : 'bg-iron/50'}`}
              >
                <span className={`pointer-events-none inline-block size-5 rounded-full bg-white shadow-lg transition-transform ${config.enableImageOptimization ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
              <span className="text-sm text-ash">{config.enableImageOptimization ? 'Enabled' : 'Disabled'}</span>
            </div>
          </FormField>
          <FormField name="allowedMimeTypes" label="Allowed MIME Types">
            <div className="flex flex-wrap gap-2 pt-2">
              {ALL_MIME_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleMimeType(type)}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${config.allowedMimeTypes.includes(type) ? 'bg-signal-red/10 text-signal-red border border-signal-red/30' : 'bg-iron/10 text-steel border border-iron/30 hover:bg-iron/20'}`}
                >
                  {config.allowedMimeTypes.includes(type) && <Check className="size-3" />}
                  {type}
                </button>
              ))}
            </div>
          </FormField>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-signal-red text-pure-white hover:bg-deep-red">
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}

export { StorageClient };
