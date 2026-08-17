'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText, Plus, Pencil, Eye, Trash2, RotateCcw,
  Globe, Archive, ArrowUpDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, type ColumnDef } from '@/components/admin/table/data-table';
import { PageHeader } from '@/components/admin/ui/page-header';
import { StatCard } from '@/components/admin/ui/stat-card';
import { Skeleton, StatCardSkeleton, TableRowSkeleton } from '@/components/admin/ui/skeletons';
import { useToast } from '@/components/admin/ui/use-toast';
import {
  listCmsPages,
  publishCmsPage,
  unpublishCmsPage,
  archiveCmsPage,
  deleteCmsPage,
  restoreCmsPage,
} from '@/server/actions/cmsActions';

interface CmsPageRow {
  id: string;
  slug: string;
  title: string;
  status: string;
  featuredImageUrl?: string | null;
  seoTitle?: string | null;
  metaDescription?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  publishedAt?: string | Date | null;
  deletedAt?: string | Date | null;
}

interface PageStats {
  total: number;
  published: number;
  drafts: number;
  archived: number;
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  published: { label: 'Published', variant: 'default' },
  draft: { label: 'Draft', variant: 'secondary' },
  archived: { label: 'Archived', variant: 'outline' },
};

export function PagesClient() {
  const router = useRouter();
  const { toast } = useToast();
  const [data, setData] = React.useState<CmsPageRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [totalPages, setTotalPages] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [sortColumn, setSortColumn] = React.useState('createdAt');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc');
  const [searchValue, setSearchValue] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [stats, setStats] = React.useState<PageStats | null>(null);
  const [statsLoading, setStatsLoading] = React.useState(true);

  const fetchStats = React.useCallback(async () => {
    setStatsLoading(true);
    try {
      const allResult = await listCmsPages({ page: 1, limit: 1, search: undefined, status: undefined });
      const pubResult = await listCmsPages({ page: 1, limit: 1, search: undefined, status: 'published' });
      const draftResult = await listCmsPages({ page: 1, limit: 1, search: undefined, status: 'draft' });
      const archResult = await listCmsPages({ page: 1, limit: 1, search: undefined, status: 'archived' });

      const totalAll = allResult.success ? (allResult.data as { meta: { total: number } })?.meta?.total ?? 0 : 0;
      const totalPub = pubResult.success ? (pubResult.data as { meta: { total: number } })?.meta?.total ?? 0 : 0;
      const totalDraft = draftResult.success ? (draftResult.data as { meta: { total: number } })?.meta?.total ?? 0 : 0;
      const totalArch = archResult.success ? (archResult.data as { meta: { total: number } })?.meta?.total ?? 0 : 0;

      setStats({ total: totalAll, published: totalPub, drafts: totalDraft, archived: totalArch });
    } catch {
      // Stats are non-critical
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await listCmsPages({
        page,
        limit: pageSize,
        search: searchValue || undefined,
        status: statusFilter || undefined,
      });
      if (result.success) {
        const res = result.data as { data: CmsPageRow[]; meta: { total: number; totalPages: number } };
        setData(res.data);
        setTotal(res.meta.total);
        setTotalPages(res.meta.totalPages);
      } else {
        toast({ title: 'Error', description: result.error, variant: 'error' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load pages', variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchValue, statusFilter, toast]);

  React.useEffect(() => { fetchData(); }, [fetchData]);
  React.useEffect(() => { fetchStats(); }, [fetchStats]);

  async function handlePublish(id: string) {
    const result = await publishCmsPage(id);
    if (result.success) {
      toast({ title: 'Published', description: 'Page is now live', variant: 'success' });
      fetchData();
      fetchStats();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'error' });
    }
  }

  async function handleUnpublish(id: string) {
    const result = await unpublishCmsPage(id);
    if (result.success) {
      toast({ title: 'Unpublished', description: 'Page is now a draft', variant: 'success' });
      fetchData();
      fetchStats();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'error' });
    }
  }

  async function handleArchive(id: string) {
    const result = await archiveCmsPage(id);
    if (result.success) {
      toast({ title: 'Archived', description: 'Page archived', variant: 'success' });
      fetchData();
      fetchStats();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'error' });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this page?')) return;
    const result = await deleteCmsPage(id);
    if (result.success) {
      toast({ title: 'Deleted', description: 'Page deleted', variant: 'success' });
      fetchData();
      fetchStats();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'error' });
    }
  }

  async function handleRestore(id: string) {
    const result = await restoreCmsPage(id);
    if (result.success) {
      toast({ title: 'Restored', description: 'Page restored', variant: 'success' });
      fetchData();
      fetchStats();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'error' });
    }
  }

  function formatDate(date: string | Date | null | undefined): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  }

  const columns: ColumnDef<CmsPageRow>[] = [
    {
      id: 'title',
      header: 'Page',
      accessorKey: 'title',
      sortable: true,
      searchable: true,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-iron/10">
            <FileText className="h-5 w-5 text-steel" />
          </div>
          <div>
            <div className="font-medium text-pure-white">{row.title}</div>
            <div className="text-sm text-steel">/{row.slug}</div>
          </div>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => {
        const config = STATUS_CONFIG[row.status] ?? { label: row.status, variant: 'outline' as const };
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      id: 'seo',
      header: 'SEO',
      cell: (row) => (
        <div className="text-sm text-steel">
          {row.seoTitle ? (
            <span className="line-clamp-1">{row.seoTitle}</span>
          ) : (
            <span className="text-iron">No SEO title</span>
          )}
        </div>
      ),
    },
    {
      id: 'publishedAt',
      header: 'Published',
      accessorKey: 'publishedAt',
      sortable: true,
      cell: (row) => <span className="text-sm text-steel">{formatDate(row.publishedAt)}</span>,
    },
    {
      id: 'updatedAt',
      header: 'Updated',
      accessorKey: 'updatedAt',
      sortable: true,
      cell: (row) => <span className="text-sm text-steel">{formatDate(row.updatedAt)}</span>,
    },
    {
      id: 'actions',
      header: '',
      cell: (row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => router.push(`/admin/pages/${row.id}/edit`)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          {row.status === 'draft' && (
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handlePublish(row.id)}>
              <Globe className="h-4 w-4 text-green-400" />
            </Button>
          )}
          {row.status === 'published' && (
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleUnpublish(row.id)}>
              <Eye className="h-4 w-4 text-amber-400" />
            </Button>
          )}
          {row.status !== 'archived' && (
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleArchive(row.id)}>
              <Archive className="h-4 w-4 text-steel" />
            </Button>
          )}
          {row.deletedAt ? (
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleRestore(row.id)}>
              <RotateCcw className="h-4 w-4 text-blue-400" />
            </Button>
          ) : (
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleDelete(row.id)}>
              <Trash2 className="h-4 w-4 text-red-400" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const filters = [
    {
      id: 'status',
      label: 'Status',
      options: [
        { label: 'Published', value: 'published' },
        { label: 'Draft', value: 'draft' },
        { label: 'Archived', value: 'archived' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pages"
        description="Manage static CMS pages"
        action={{ label: 'New Page', href: '/admin/pages/new', icon: Plus }}
      />

      {/* Stats */}
      {statsLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Pages" value={stats.total} icon="FileText" />
          <StatCard title="Published" value={stats.published} icon="Globe" />
          <StatCard title="Drafts" value={stats.drafts} icon="Pencil" />
          <StatCard title="Archived" value={stats.archived} icon="Archive" />
        </div>
      ) : null}

      {/* Table */}
      <div className="rounded-[10px] border border-iron/30 bg-carbon">
        <DataTable
          columns={columns as unknown as ColumnDef<Record<string, unknown>>[]}
          data={data as unknown as Record<string, unknown>[]}
          total={total}
          page={page}
          pageSize={pageSize}
          totalPages={totalPages}
          loading={loading}
          searchPlaceholder="Search pages..."
          searchValue={searchValue}
          onSearchChange={(v) => { setSearchValue(v); setPage(1); }}
          onPageChange={setPage}
          onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
          onSortChange={(col, dir) => { setSortColumn(col); setSortDirection(dir); }}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          filters={filters}
          activeFilters={{ status: statusFilter }}
          onFilterChange={(id, value) => { if (id === 'status') { setStatusFilter(value); setPage(1); } }}
          onClearFilters={() => { setStatusFilter(''); setPage(1); }}
          emptyTitle="No pages yet"
          emptyDescription="Create your first CMS page to get started."
          emptyIcon={FileText}
          onRowClick={(row) => router.push(`/admin/pages/${(row as unknown as CmsPageRow).id}/edit`)}
          getRowId={(row) => (row as unknown as CmsPageRow).id}
        />
      </div>
    </div>
  );
}
