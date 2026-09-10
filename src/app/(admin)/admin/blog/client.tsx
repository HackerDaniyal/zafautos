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
import { listBlogPosts, deleteBlogPost } from '@/server/actions/cmsActions';

export function BlogClient() {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    const result = await listBlogPosts({ search, limit: 50 });
    if (result.success) setItems((result.data as any).items || []);
    setLoading(false);
  }, [search]);

  React.useEffect(() => { load(); }, [load]);

  async function handleDelete(id: string) {
    const result = await deleteBlogPost(id);
    if (result.success) { toast({ title: 'Post deleted' }); load(); }
    else toast({ title: 'Error', description: result.error, variant: 'error' });
  }

  return (
    <>
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-steel" />
          <Input placeholder="Search posts..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>
      <Card className="border-iron/30 bg-carbon">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-iron/30">
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-steel">Loading...</TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-steel">No posts found</TableCell></TableRow>
              ) : items.map((p) => (
                <TableRow key={p.id} className="border-iron/30">
                  <TableCell className="font-medium">{p.title}</TableCell>
                  <TableCell><Badge variant={p.status === 'published' ? 'default' : 'secondary'}>{p.status}</Badge></TableCell>
                  <TableCell>{p.category || '-'}</TableCell>
                  <TableCell>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/blog/${p.id}/edit`)}><Edit className="size-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => { if (window.confirm('Are you sure you want to delete this post?')) handleDelete(p.id); }}><Trash2 className="size-4 text-destructive" /></Button>
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
