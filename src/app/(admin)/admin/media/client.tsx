'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/admin/ui/use-toast';
import { Search, Trash2, Image, FileText, Film } from 'lucide-react';
import { listMediaUploads, deleteMediaUpload } from '@/server/actions/cmsActions';

function getIcon(mime: string | null) {
  if (!mime) return FileText;
  if (mime.startsWith('image/')) return Image;
  if (mime.startsWith('video/')) return Film;
  return FileText;
}

export function MediaClient() {
  const { toast } = useToast();
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    const result = await listMediaUploads({ search, limit: 50 });
    if (result.success) setItems((result.data as any).items || []);
    setLoading(false);
  }, [search]);

  React.useEffect(() => { load(); }, [load]);

  async function handleDelete(id: string) {
    const result = await deleteMediaUpload(id);
    if (result.success) { toast({ title: 'Media deleted' }); load(); }
    else toast({ title: 'Error', description: result.error, variant: 'error' });
  }

  function formatSize(bytes: number | null) {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  return (
    <>
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-steel" />
          <Input placeholder="Search media..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>
      <Card className="border-iron/30 bg-carbon">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-iron/30">
                <TableHead>File</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Dimensions</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-steel">Loading...</TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-steel">No media found</TableCell></TableRow>
              ) : items.map((m) => {
                const Icon = getIcon(m.mimeType);
                return (
                  <TableRow key={m.id} className="border-iron/30">
                    <TableCell className="flex items-center gap-2"><Icon className="size-4 text-steel" /><span className="font-medium">{m.filename}</span></TableCell>
                    <TableCell><Badge variant="outline">{m.mimeType || 'unknown'}</Badge></TableCell>
                    <TableCell>{formatSize(m.fileSize)}</TableCell>
                    <TableCell>{m.width && m.height ? `${m.width}x${m.height}` : '-'}</TableCell>
                    <TableCell>{m.createdAt ? new Date(m.createdAt).toLocaleDateString() : '-'}</TableCell>
                    <TableCell><Button variant="ghost" size="sm" onClick={() => { if (window.confirm('Are you sure you want to delete this media?')) handleDelete(m.id); }}><Trash2 className="size-4 text-destructive" /></Button></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
