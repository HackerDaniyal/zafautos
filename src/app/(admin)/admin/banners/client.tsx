'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/admin/ui/use-toast';
import { Search, Trash2, Eye, EyeOff, Plus, Edit } from 'lucide-react';
import { listBanners, deleteBanner } from '@/server/actions/cmsActions';
import Link from 'next/link';

export function BannersClient() {
  const router = useRouter();
  const { toast } = useToast();
  const [banners, setBanners] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const load = React.useCallback(async () => {
    setLoading(true);
    const result = await listBanners({ search, limit: 50 });
    if (result.success) {
      setBanners((result.data as any).items || []);
    }
    setLoading(false);
  }, [search]);

  React.useEffect(() => { load(); }, [load]);

  async function handleDelete(id: string) {
    const result = await deleteBanner(id);
    if (result.success) {
      toast({ title: 'Banner deleted' });
      load();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'error' });
    }
  }

  return (
    <>
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-steel" />
          <Input placeholder="Search banners..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <Card className="border-iron/30 bg-carbon">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-iron/30">
                <TableHead>Title</TableHead>
                <TableHead>Placement</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Order</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-steel">Loading...</TableCell></TableRow>
              ) : banners.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-steel">No banners found</TableCell></TableRow>
              ) : banners.map((b) => (
                <TableRow key={b.id} className="border-iron/30">
                  <TableCell className="font-medium">{b.title}</TableCell>
                  <TableCell><Badge variant="outline">{b.placement}</Badge></TableCell>
                  <TableCell>{b.isActive ? <Badge className="bg-green-500/10 text-green-500">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}</TableCell>
                  <TableCell>{b.displayOrder}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/banners/${b.id}/edit`)}><Edit className="size-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => { if (window.confirm('Are you sure you want to delete this banner?')) handleDelete(b.id); }}><Trash2 className="size-4 text-destructive" /></Button>
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
