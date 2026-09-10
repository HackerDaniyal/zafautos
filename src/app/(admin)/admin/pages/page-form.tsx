'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Globe, Eye, Archive, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/admin/ui/page-header';
import { useToast } from '@/components/admin/ui/use-toast';
import { Skeleton } from '@/components/admin/ui/skeletons';
import {
  getCmsPage,
  createCmsPage,
  updateCmsPage,
  publishCmsPage,
  unpublishCmsPage,
  archiveCmsPage,
} from '@/server/actions/cmsActions';

interface PageFormData {
  slug: string;
  title: string;
  content: string;
  status: 'draft' | 'published' | 'archived';
  seoTitle: string;
  metaDescription: string;
  featuredImageUrl: string;
  canonicalUrl: string;
  ogImage: string;
  robotsIndex: boolean;
  robotsFollow: boolean;
}

const DEFAULT_FORM: PageFormData = {
  slug: '',
  title: '',
  content: '',
  status: 'draft',
  seoTitle: '',
  metaDescription: '',
  featuredImageUrl: '',
  canonicalUrl: '',
  ogImage: '',
  robotsIndex: true,
  robotsFollow: true,
};

interface PageFormProps {
  pageId?: string;
}

export function PageForm({ pageId }: PageFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEditing = !!pageId;

  const [form, setForm] = React.useState<PageFormData>(DEFAULT_FORM);
  const [loading, setLoading] = React.useState(isEditing);
  const [saving, setSaving] = React.useState(false);
  const [currentStatus, setCurrentStatus] = React.useState<string>('draft');

  React.useEffect(() => {
    if (!pageId) return;
    (async () => {
      const result = await getCmsPage(pageId);
      if (result.success && result.data) {
        const p = result.data as Record<string, unknown>;
        setForm({
          slug: (p.slug as string) ?? '',
          title: (p.title as string) ?? '',
          content: (p.content as string) ?? '',
          status: (p.status as PageFormData['status']) ?? 'draft',
          seoTitle: (p.seoTitle as string) ?? '',
          metaDescription: (p.metaDescription as string) ?? '',
          featuredImageUrl: (p.featuredImageUrl as string) ?? '',
          canonicalUrl: (p.canonicalUrl as string) ?? '',
          ogImage: (p.ogImage as string) ?? '',
          robotsIndex: (p.robotsIndex as boolean) ?? true,
          robotsFollow: (p.robotsFollow as boolean) ?? true,
        });
        setCurrentStatus((p.status as string) ?? 'draft');
      } else {
        toast({ title: 'Error', description: 'Failed to load page', variant: 'error' });
        router.push('/admin/pages');
      }
      setLoading(false);
    })();
  }, [pageId, router, toast]);

  function updateField<K extends keyof PageFormData>(key: K, value: PageFormData[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'title' && !isEditing) {
        next.slug = (value as string)
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
      }
      return next;
    });
  }

  async function handleSave() {
    if (!form.title.trim()) {
      toast({ title: 'Error', description: 'Title is required', variant: 'error' });
      return;
    }
    if (!form.slug.trim()) {
      toast({ title: 'Error', description: 'Slug is required', variant: 'error' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        slug: form.slug,
        title: form.title,
        content: form.content || undefined,
        status: form.status,
        featuredImageUrl: form.featuredImageUrl || undefined,
        seoTitle: form.seoTitle || undefined,
        metaDescription: form.metaDescription || undefined,
        canonicalUrl: form.canonicalUrl || undefined,
        ogImage: form.ogImage || undefined,
        robotsIndex: form.robotsIndex,
        robotsFollow: form.robotsFollow,
      };

      let result;
      if (isEditing) {
        result = await updateCmsPage(pageId!, payload);
      } else {
        result = await createCmsPage(payload);
      }

      if (result.success) {
        toast({
          title: isEditing ? 'Updated' : 'Created',
          description: `Page ${isEditing ? 'updated' : 'created'} successfully`,
          variant: 'success',
        });
        if (!isEditing && result.data) {
          const newId = (result.data as { id: string }).id;
          router.push(`/admin/pages/${newId}/edit`);
        }
      } else {
        toast({ title: 'Error', description: result.error, variant: 'error' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to save page', variant: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    if (!pageId) return;
    const result = await publishCmsPage(pageId);
    if (result.success) {
      setCurrentStatus('published');
      setForm((prev) => ({ ...prev, status: 'published' }));
      toast({ title: 'Published', description: 'Page is now live', variant: 'success' });
    } else {
      toast({ title: 'Error', description: result.error, variant: 'error' });
    }
  }

  async function handleUnpublish() {
    if (!pageId) return;
    const result = await unpublishCmsPage(pageId);
    if (result.success) {
      setCurrentStatus('draft');
      setForm((prev) => ({ ...prev, status: 'draft' }));
      toast({ title: 'Unpublished', description: 'Page is now a draft', variant: 'success' });
    } else {
      toast({ title: 'Error', description: result.error, variant: 'error' });
    }
  }

  async function handleArchive() {
    if (!pageId) return;
    const result = await archiveCmsPage(pageId);
    if (result.success) {
      setCurrentStatus('archived');
      setForm((prev) => ({ ...prev, status: 'archived' }));
      toast({ title: 'Archived', description: 'Page archived', variant: 'success' });
    } else {
      toast({ title: 'Error', description: result.error, variant: 'error' });
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Loading..." />
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/admin/pages')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-pure-white">
              {isEditing ? 'Edit Page' : 'New Page'}
            </h1>
            {isEditing && (
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={
                  currentStatus === 'published' ? 'default' :
                  currentStatus === 'archived' ? 'outline' : 'secondary'
                }>
                  {currentStatus}
                </Badge>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing && currentStatus === 'draft' && (
            <Button variant="outline" size="sm" onClick={handlePublish}>
              <Globe className="mr-2 h-4 w-4" />
              Publish
            </Button>
          )}
          {isEditing && currentStatus === 'published' && (
            <Button variant="outline" size="sm" onClick={handleUnpublish}>
              <Eye className="mr-2 h-4 w-4" />
              Unpublish
            </Button>
          )}
          {isEditing && currentStatus !== 'archived' && (
            <Button variant="outline" size="sm" onClick={handleArchive}>
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </Button>
          )}
          <Button size="sm" onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-[10px] border border-iron/30 bg-carbon p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-steel mb-1.5">Title</label>
              <Input
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="Page title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-steel mb-1.5">Slug</label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-steel">/</span>
                <Input
                  value={form.slug}
                  onChange={(e) => updateField('slug', e.target.value)}
                  placeholder="page-slug"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-steel mb-1.5">Content</label>
              <Textarea
                value={form.content}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateField('content', e.target.value)}
                placeholder="Page content (HTML supported)"
                className="min-h-[300px] font-mono text-sm"
              />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="rounded-[10px] border border-iron/30 bg-carbon p-6">
            <h3 className="text-sm font-medium text-pure-white mb-4">Status</h3>
            <div className="space-y-2">
              {(['draft', 'published', 'archived'] as const).map((status) => (
                <label key={status} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value={status}
                    checked={form.status === status}
                    onChange={() => updateField('status', status)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm text-steel capitalize">{status}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Featured Image */}
          <div className="rounded-[10px] border border-iron/30 bg-carbon p-6">
            <h3 className="text-sm font-medium text-pure-white mb-4">Featured Image</h3>
            <div>
              <label className="block text-sm font-medium text-steel mb-1.5">Image URL</label>
              <Input
                value={form.featuredImageUrl}
                onChange={(e) => updateField('featuredImageUrl', e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* SEO */}
          <div className="rounded-[10px] border border-iron/30 bg-carbon p-6 space-y-4">
            <h3 className="text-sm font-medium text-pure-white">SEO</h3>
            <div>
              <label className="block text-sm font-medium text-steel mb-1.5">SEO Title</label>
              <Input
                value={form.seoTitle}
                onChange={(e) => updateField('seoTitle', e.target.value)}
                placeholder="SEO title (defaults to page title)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-steel mb-1.5">Meta Description</label>
              <Textarea
                value={form.metaDescription}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateField('metaDescription', e.target.value)}
                placeholder="Meta description for search engines"
                className="min-h-[80px]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-steel mb-1.5">Canonical URL</label>
              <Input
                value={form.canonicalUrl}
                onChange={(e) => updateField('canonicalUrl', e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-steel mb-1.5">OG Image</label>
              <Input
                value={form.ogImage}
                onChange={(e) => updateField('ogImage', e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.robotsIndex}
                  onChange={(e) => updateField('robotsIndex', e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm text-steel">Allow indexing</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.robotsFollow}
                  onChange={(e) => updateField('robotsFollow', e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm text-steel">Allow follow links</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
