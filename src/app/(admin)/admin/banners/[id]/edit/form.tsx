'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/admin/ui/use-toast';
import { createBanner, getBanner, updateBanner } from '@/server/actions/cmsActions';

export function BannerForm({ id }: { id?: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [form, setForm] = React.useState({
    title: '', description: '', imageUrl: '', mobileImageUrl: '', buttonText: '', buttonLink: '', placement: 'homepage', isActive: true, displayOrder: 0,
  });

  React.useEffect(() => {
    if (id) {
      getBanner(id).then(r => {
        if (r.success) {
          const d = r.data as any;
          setForm({ title: d.title, description: d.description || '', imageUrl: d.imageUrl || '', mobileImageUrl: d.mobileImageUrl || '', buttonText: d.buttonText || '', buttonLink: d.buttonLink || '', placement: d.placement || 'homepage', isActive: d.isActive, displayOrder: d.displayOrder });
        }
      });
    }
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = id ? await updateBanner(id, form) : await createBanner(form);
    setLoading(false);
    if (result.success) {
      toast({ title: id ? 'Banner updated' : 'Banner created' });
      router.push('/admin/banners');
    } else {
      toast({ title: 'Error', description: result.error, variant: 'error' });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <Card className="border-iron/30 bg-carbon">
        <CardHeader><CardTitle>Banner Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input value={form.imageUrl} onChange={e => setForm(p => ({ ...p, imageUrl: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Mobile Image URL</Label>
              <Input value={form.mobileImageUrl} onChange={e => setForm(p => ({ ...p, mobileImageUrl: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Button Text</Label>
              <Input value={form.buttonText} onChange={e => setForm(p => ({ ...p, buttonText: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Button Link</Label>
              <Input value={form.buttonLink} onChange={e => setForm(p => ({ ...p, buttonLink: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Placement</Label>
              <Input value={form.placement} onChange={e => setForm(p => ({ ...p, placement: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Display Order</Label>
              <Input type="number" value={form.displayOrder} onChange={e => setForm(p => ({ ...p, displayOrder: parseInt(e.target.value) || 0 }))} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox checked={form.isActive} onCheckedChange={v => setForm(p => ({ ...p, isActive: v === true }))} />
            <Label>Active</Label>
          </div>
        </CardContent>
      </Card>
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>{loading ? 'Saving...' : id ? 'Update' : 'Create'}</Button>
        <Button type="button" variant="outline" onClick={() => router.push('/admin/banners')}>Cancel</Button>
      </div>
    </form>
  );
}
