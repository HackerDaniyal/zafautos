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
import { createFaq, getFaq, updateFaq } from '@/server/actions/cmsActions';

export function FaqForm({ id }: { id?: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [form, setForm] = React.useState({ question: '', answer: '', category: 'general', displayOrder: 0, isPublished: true });

  React.useEffect(() => {
    if (id) {
      getFaq(id).then(r => {
        if (r.success) { const d = r.data as any; setForm({ question: d.question, answer: d.answer, category: d.category || 'general', displayOrder: d.displayOrder, isPublished: d.isPublished }); }
      });
    }
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = id ? await updateFaq(id, form) : await createFaq(form);
    setLoading(false);
    if (result.success) { toast({ title: id ? 'FAQ updated' : 'FAQ created' }); router.push('/admin/faqs'); }
    else toast({ title: 'Error', description: result.error, variant: 'error' });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <Card className="border-iron/30 bg-carbon">
        <CardHeader><CardTitle>FAQ Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Question *</Label><Input value={form.question} onChange={e => setForm(p => ({ ...p, question: e.target.value }))} required /></div>
          <div className="space-y-2"><Label>Answer *</Label><Textarea value={form.answer} onChange={e => setForm(p => ({ ...p, answer: e.target.value }))} required rows={5} /></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2"><Label>Category</Label><Input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Display Order</Label><Input type="number" value={form.displayOrder} onChange={e => setForm(p => ({ ...p, displayOrder: parseInt(e.target.value) || 0 }))} /></div>
            <div className="flex items-end pb-2"><div className="flex items-center gap-2"><Checkbox checked={form.isPublished} onCheckedChange={v => setForm(p => ({ ...p, isPublished: !!v }))} /><Label>Published</Label></div></div>
          </div>
        </CardContent>
      </Card>
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>{loading ? 'Saving...' : id ? 'Update' : 'Create'}</Button>
        <Button type="button" variant="outline" onClick={() => router.push('/admin/faqs')}>Cancel</Button>
      </div>
    </form>
  );
}
