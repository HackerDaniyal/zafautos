'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/admin/ui/use-toast';
import { Search, Trash2, Edit } from 'lucide-react';
import { listFaqs, deleteFaq } from '@/server/actions/cmsActions';

export function FaqsClient() {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    const result = await listFaqs({ search, limit: 50 });
    if (result.success) setItems((result.data as any).items || []);
    setLoading(false);
  }, [search]);

  React.useEffect(() => { load(); }, [load]);

  async function handleDelete(id: string) {
    const result = await deleteFaq(id);
    if (result.success) { toast({ title: 'FAQ deleted' }); load(); }
    else toast({ title: 'Error', description: result.error, variant: 'error' });
  }

  return (
    <>
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-steel" />
          <Input placeholder="Search FAQs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>
      <Card className="border-iron/30 bg-carbon">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-iron/30">
                <TableHead>Question</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Order</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-steel">Loading...</TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-steel">No FAQs found</TableCell></TableRow>
              ) : items.map((f) => (
                <TableRow key={f.id} className="border-iron/30">
                  <TableCell className="font-medium max-w-xs truncate">{f.question}</TableCell>
                  <TableCell><Badge variant="outline">{f.category || 'general'}</Badge></TableCell>
                  <TableCell>{f.isPublished ? <Badge className="bg-green-500/10 text-green-500">Published</Badge> : <Badge variant="secondary">Draft</Badge>}</TableCell>
                  <TableCell>{f.displayOrder}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/faqs/${f.id}/edit`)}><Edit className="size-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => { if (window.confirm('Are you sure you want to delete this FAQ?')) handleDelete(f.id); }}><Trash2 className="size-4 text-destructive" /></Button>
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
