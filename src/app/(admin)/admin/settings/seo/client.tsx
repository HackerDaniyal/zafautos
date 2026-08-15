'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Globe, Twitter, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/admin/forms/form-field';
import { PageHeader } from '@/components/admin/ui/page-header';
import { getSeoSettings, updateSeoSettings } from '@/server/actions/seoActions';

interface SeoData {
  siteTitle?: string;
  siteDescription?: string;
  defaultKeywords?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  twitterSite?: string;
  twitterCreator?: string;
  robotsIndex?: boolean;
  robotsFollow?: boolean;
  sitemapEnabled?: boolean;
  faviconUrl?: string;
}

function SeoClient() {
  const [form, setForm] = useState<SeoData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getSeoSettings();
      if (result.success && result.data) {
        setForm(result.data as SeoData);
      }
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

  async function handleSave() {
    setSaving(true);
    try {
      const result = await updateSeoSettings(form);
      if (result.success) {
        setFeedback({ type: 'success', message: 'SEO settings saved' });
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
        <p className="mt-2 text-sm text-steel">Loading SEO settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="SEO Settings" description="Configure site-wide SEO defaults and meta tags" />

      {feedback && (
        <div className={`rounded-[6px] px-4 py-3 text-sm ${feedback.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-signal-red/10 text-signal-red border border-signal-red/30'}`}>
          {feedback.message}
        </div>
      )}

      <div className="rounded-[10px] border border-iron/30 bg-carbon p-6">
        <div className="flex items-center gap-2 mb-6">
          <Search className="size-5 text-signal-red" />
          <h2 className="text-lg font-semibold text-pure-white">General SEO</h2>
        </div>
        <div className="space-y-4 max-w-lg">
          <FormField name="siteTitle" label="Site Title">
            <Input
              value={form.siteTitle ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, siteTitle: e.target.value }))}
              placeholder="ZafAutos Japan - Quality Japanese Vehicle Imports"
              className="bg-deep-carbon border-iron/30 text-pure-white"
            />
          </FormField>
          <FormField name="siteDescription" label="Meta Description">
            <textarea
              value={form.siteDescription ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, siteDescription: e.target.value }))}
              placeholder="Import quality Japanese vehicles with ZafAutos Japan..."
              rows={3}
              className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white"
            />
          </FormField>
          <FormField name="defaultKeywords" label="Default Keywords (comma-separated)">
            <Input
              value={form.defaultKeywords ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, defaultKeywords: e.target.value }))}
              placeholder="japanese cars, import vehicles, used cars japan"
              className="bg-deep-carbon border-iron/30 text-pure-white"
            />
          </FormField>
          <FormField name="canonicalUrl" label="Canonical URL">
            <Input
              value={form.canonicalUrl ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, canonicalUrl: e.target.value }))}
              placeholder="https://zafautos.com"
              className="bg-deep-carbon border-iron/30 text-pure-white"
            />
          </FormField>
          <FormField name="faviconUrl" label="Favicon URL">
            <Input
              value={form.faviconUrl ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, faviconUrl: e.target.value }))}
              placeholder="https://zafautos.com/favicon.ico"
              className="bg-deep-carbon border-iron/30 text-pure-white"
            />
          </FormField>
        </div>
      </div>

      <div className="rounded-[10px] border border-iron/30 bg-carbon p-6">
        <div className="flex items-center gap-2 mb-6">
          <Globe className="size-5 text-signal-red" />
          <h2 className="text-lg font-semibold text-pure-white">Open Graph</h2>
        </div>
        <div className="space-y-4 max-w-lg">
          <FormField name="ogTitle" label="OG Title">
            <Input
              value={form.ogTitle ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, ogTitle: e.target.value }))}
              placeholder="ZafAutos Japan"
              className="bg-deep-carbon border-iron/30 text-pure-white"
            />
          </FormField>
          <FormField name="ogDescription" label="OG Description">
            <textarea
              value={form.ogDescription ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, ogDescription: e.target.value }))}
              placeholder="Quality Japanese vehicle imports..."
              rows={2}
              className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white"
            />
          </FormField>
          <FormField name="ogImage" label="OG Image URL">
            <Input
              value={form.ogImage ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, ogImage: e.target.value }))}
              placeholder="https://zafautos.com/og-image.jpg"
              className="bg-deep-carbon border-iron/30 text-pure-white"
            />
          </FormField>
          <FormField name="ogType" label="OG Type">
            <select
              value={form.ogType ?? 'website'}
              onChange={(e) => setForm((f) => ({ ...f, ogType: e.target.value }))}
              className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white"
            >
              <option value="website">Website</option>
              <option value="product">Product</option>
              <option value="article">Article</option>
            </select>
          </FormField>
        </div>
      </div>

      <div className="rounded-[10px] border border-iron/30 bg-carbon p-6">
        <div className="flex items-center gap-2 mb-6">
          <Twitter className="size-5 text-signal-red" />
          <h2 className="text-lg font-semibold text-pure-white">Twitter / X Card</h2>
        </div>
        <div className="space-y-4 max-w-lg">
          <FormField name="twitterCard" label="Card Type">
            <select
              value={form.twitterCard ?? 'summary'}
              onChange={(e) => setForm((f) => ({ ...f, twitterCard: e.target.value as 'summary' | 'summary_large_image' }))}
              className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white"
            >
              <option value="summary">Summary</option>
              <option value="summary_large_image">Summary Large Image</option>
            </select>
          </FormField>
          <FormField name="twitterSite" label="Site Handle">
            <Input
              value={form.twitterSite ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, twitterSite: e.target.value }))}
              placeholder="@zafautos"
              className="bg-deep-carbon border-iron/30 text-pure-white"
            />
          </FormField>
          <FormField name="twitterCreator" label="Creator Handle">
            <Input
              value={form.twitterCreator ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, twitterCreator: e.target.value }))}
              placeholder="@zafautos"
              className="bg-deep-carbon border-iron/30 text-pure-white"
            />
          </FormField>
        </div>
      </div>

      <div className="rounded-[10px] border border-iron/30 bg-carbon p-6">
        <div className="flex items-center gap-2 mb-6">
          <Bot className="size-5 text-signal-red" />
          <h2 className="text-lg font-semibold text-pure-white">Robots & Sitemap</h2>
        </div>
        <div className="space-y-4 max-w-lg">
          <FormField name="robotsIndex" label="Allow Indexing">
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, robotsIndex: !f.robotsIndex }))}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${form.robotsIndex ? 'bg-signal-red' : 'bg-iron/50'}`}
              >
                <span className={`pointer-events-none inline-block size-5 rounded-full bg-white shadow-lg transition-transform ${form.robotsIndex ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
              <span className="text-sm text-ash">{form.robotsIndex ? 'Indexing allowed' : 'Indexing blocked'}</span>
            </div>
          </FormField>
          <FormField name="robotsFollow" label="Allow Following Links">
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, robotsFollow: !f.robotsFollow }))}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${form.robotsFollow ? 'bg-signal-red' : 'bg-iron/50'}`}
              >
                <span className={`pointer-events-none inline-block size-5 rounded-full bg-white shadow-lg transition-transform ${form.robotsFollow ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
              <span className="text-sm text-ash">{form.robotsFollow ? 'Following allowed' : 'Following blocked'}</span>
            </div>
          </FormField>
          <FormField name="sitemapEnabled" label="Sitemap Enabled">
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, sitemapEnabled: !f.sitemapEnabled }))}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${form.sitemapEnabled ? 'bg-signal-red' : 'bg-iron/50'}`}
              >
                <span className={`pointer-events-none inline-block size-5 rounded-full bg-white shadow-lg transition-transform ${form.sitemapEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
              <span className="text-sm text-ash">{form.sitemapEnabled ? 'Sitemap enabled' : 'Sitemap disabled'}</span>
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

export { SeoClient };
