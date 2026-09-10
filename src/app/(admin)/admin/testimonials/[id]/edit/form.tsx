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
import { createTestimonial, getTestimonial, updateTestimonial } from '@/server/actions/cmsActions';

export function TestimonialForm({ id }: { id?: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [form, setForm] = React.useState({ customerName: '', customerLocation: '', customerImageUrl: '', quote: '', rating: 5, isPublished: false, displayOrder: 0 });

  React.useEffect(() => {
    if (id) {
      getTestimonial(id).then(r => {
        if (r.success) { const d = r.data as any; setForm({ customerName: d.customerName, customerLocation: d.customerLocation || '', customerImageUrl: d.customerImageUrl || '', quote: d.quote, rating: d.rating || 5, isPublished: d.isPublished, displayOrder: d.displayOrder }); }
      });
    }
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = id ? await updateTestimonial(id, form) : await createTestimonial(form);
    setLoading(false);
    if (result.success) { toast({ title: id ? 'Testimonial updated' : 'Testimonial created' }); router.push('/admin/testimonials'); }
    else toast({ title: 'Error', description: result.error, variant: 'error' });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <Card className="border-iron/30 bg-carbon">
        <CardHeader><CardTitle>Testimonial Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Customer Name *</Label><Input value={form.customerName} onChange={e => setForm(p => ({ ...p, customerName: e.target.value }))} required /></div>
            <div className="space-y-2"><Label>Location</Label><Input value={form.customerLocation} onChange={e => setForm(p => ({ ...p, customerLocation: e.target.value }))} /></div>
          </div>
          <div className="space-y-2"><Label>Quote *</Label><Textarea value={form.quote} onChange={e => setForm(p => ({ ...p, quote: e.target.value }))} required /></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2"><Label>Rating (1-5)</Label><Input type="number" min="1" max="5" value={form.rating} onChange={e => setForm(p => ({ ...p, rating: parseInt(e.target.value) || 5 }))} /></div>
            <div className="space-y-2"><Label>Display Order</Label><Input type="number" value={form.displayOrder} onChange={e => setForm(p => ({ ...p, displayOrder: parseInt(e.target.value) || 0 }))} /></div>
            <div className="flex items-end pb-2"><div className="flex items-center gap-2"><Checkbox checked={form.isPublished} onCheckedChange={v => setForm(p => ({ ...p, isPublished: !!v }))} /><Label>Published</Label></div></div>
          </div>
          <div className="space-y-2"><Label>Image URL</Label><Input value={form.customerImageUrl} onChange={e => setForm(p => ({ ...p, customerImageUrl: e.target.value }))} /></div>
        </CardContent>
      </Card>
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>{loading ? 'Saving...' : id ? 'Update' : 'Create'}</Button>
        <Button type="button" variant="outline" onClick={() => router.push('/admin/testimonials')}>Cancel</Button>
      </div>
    </form>
  );
}
