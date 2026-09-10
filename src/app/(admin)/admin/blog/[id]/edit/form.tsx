'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/admin/ui/use-toast';
import { createBlogPost, getBlogPost, updateBlogPost } from '@/server/actions/cmsActions';

export function BlogPostForm({ id }: { id?: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [form, setForm] = React.useState({ title: '', slug: '', excerpt: '', content: '', featuredImageUrl: '', author: '', category: '', tags: '', status: 'draft' as 'draft' | 'published' | 'archived', seoTitle: '', seoDescription: '' });

  React.useEffect(() => {
    if (id) {
      getBlogPost(id).then(r => {
        if (r.success) { const d = r.data as any; setForm({ title: d.title, slug: d.slug, excerpt: d.excerpt || '', content: d.content || '', featuredImageUrl: d.featuredImageUrl || '', author: d.author || '', category: d.category || '', tags: d.tags || '', status: d.status, seoTitle: d.seoTitle || '', seoDescription: d.seoDescription || '' }); }
      });
    }
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = id ? await updateBlogPost(id, form) : await createBlogPost(form);
    setLoading(false);
    if (result.success) { toast({ title: id ? 'Post updated' : 'Post created' }); router.push('/admin/blog'); }
    else toast({ title: 'Error', description: result.error, variant: 'error' });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      <Card className="border-iron/30 bg-carbon">
        <CardHeader><CardTitle>Post Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Title *</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required /></div>
            <div className="space-y-2"><Label>Slug</Label><Input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} placeholder="auto-generated" /></div>
          </div>
          <div className="space-y-2"><Label>Excerpt</Label><Textarea value={form.excerpt} onChange={e => setForm(p => ({ ...p, excerpt: e.target.value }))} rows={2} /></div>
          <div className="space-y-2"><Label>Content</Label><Textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} rows={10} /></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2"><Label>Author</Label><Input value={form.author} onChange={e => setForm(p => ({ ...p, author: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Category</Label><Input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Tags</Label><Input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} placeholder="comma-separated" /></div>
          </div>
          <div className="space-y-2"><Label>Featured Image URL</Label><Input value={form.featuredImageUrl} onChange={e => setForm(p => ({ ...p, featuredImageUrl: e.target.value }))} /></div>
          <div className="space-y-2"><Label>Status</Label>
            <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v as 'draft' | 'published' | 'archived' }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="published">Published</SelectItem><SelectItem value="archived">Archived</SelectItem></SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      <Card className="border-iron/30 bg-carbon">
        <CardHeader><CardTitle>SEO</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>SEO Title</Label><Input value={form.seoTitle} onChange={e => setForm(p => ({ ...p, seoTitle: e.target.value }))} /></div>
          <div className="space-y-2"><Label>SEO Description</Label><Textarea value={form.seoDescription} onChange={e => setForm(p => ({ ...p, seoDescription: e.target.value }))} rows={2} /></div>
        </CardContent>
      </Card>
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>{loading ? 'Saving...' : id ? 'Update' : 'Create'}</Button>
        <Button type="button" variant="outline" onClick={() => router.push('/admin/blog')}>Cancel</Button>
      </div>
    </form>
  );
}
