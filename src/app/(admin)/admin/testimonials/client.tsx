'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/admin/ui/use-toast';
import { Search, Trash2, Edit, Star } from 'lucide-react';
import { listTestimonials, deleteTestimonial } from '@/server/actions/cmsActions';

export function TestimonialsClient() {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    const result = await listTestimonials({ search, limit: 50 });
    if (result.success) setItems((result.data as any).items || []);
    setLoading(false);
  }, [search]);

  React.useEffect(() => { load(); }, [load]);

  async function handleDelete(id: string) {
    const result = await deleteTestimonial(id);
    if (result.success) { toast({ title: 'Testimonial deleted' }); load(); }
    else toast({ title: 'Error', description: result.error, variant: 'error' });
  }

  return (
    <>
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-steel" />
          <Input placeholder="Search testimonials..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>
      <Card className="border-iron/30 bg-carbon">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-iron/30">
                <TableHead>Customer</TableHead>
                <TableHead>Quote</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-steel">Loading...</TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-steel">No testimonials found</TableCell></TableRow>
              ) : items.map((t) => (
                <TableRow key={t.id} className="border-iron/30">
                  <TableCell className="font-medium">{t.customerName}</TableCell>
                  <TableCell className="max-w-xs truncate">{t.quote}</TableCell>
                  <TableCell className="flex items-center gap-1">{Array.from({length: t.rating || 5}).map((_, i) => <Star key={i} className="size-3 fill-yellow-500 text-yellow-500" />)}</TableCell>
                  <TableCell>{t.isPublished ? <Badge className="bg-green-500/10 text-green-500">Published</Badge> : <Badge variant="secondary">Draft</Badge>}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/testimonials/${t.id}/edit`)}><Edit className="size-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => { if (window.confirm('Are you sure you want to delete this testimonial?')) handleDelete(t.id); }}><Trash2 className="size-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
