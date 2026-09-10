'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Car, Plus, Trash2, Copy, MoreVertical, ExternalLink, Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, type ColumnDef } from '@/components/admin/table/data-table';
import { FilterBar, type FilterConfig } from '@/components/admin/filters/filter-bar';
import { useFilters } from '@/components/admin/filters/use-filters';
import { useBulkSelection } from '@/components/admin/bulk/use-bulk-selection';
import { BulkActionBar, type BulkAction } from '@/components/admin/bulk/bulk-action-bar';
import { PageHeader } from '@/components/admin/ui/page-header';
import { StatCard } from '@/components/admin/ui/stat-card';
import { StatusChip, getStatusVariant } from '@/components/admin/ui/status-chip';
import { Skeleton } from '@/components/admin/ui/skeletons';
import { useToast } from '@/components/admin/ui/use-toast';
import { ConfirmDialog } from '@/components/admin/dialogs/confirm-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  getVehicleListPageData,
  bulkDeleteVehicles,
  bulkUpdateVehicleStatus,
  bulkDuplicateVehicles,
  bulkRestoreVehicles,
  softDeleteVehicle,
  duplicateVehicle,
} from '@/server/actions/vehicleActions';
import { formatPrice } from '@/lib/utils';
import {
  VEHICLE_STATUS_CONFIG,
  VEHICLE_STATUS_OPTIONS,
  VEHICLE_DEFAULT_PAGE_SIZE,
} from './constants';
import type { Vehicle, VehicleListParams, VehicleStatus } from './types';

interface VehicleRow extends Vehicle {
  _manufacturerName: string | null;
  _modelName: string | null;
  _bodyTypeName: string | null;
  _fuelTypeName: string | null;
  _transmissionTypeName: string | null;
  _countryName: string | null;
  primaryImageUrl?: string | null;
}

interface FilterOption {
  label: string;
  value: string;
}

interface VehicleStats {
  total: number;
  active: number;
  draft: number;
  sold: number;
  archived: number;
  featured: number;
  avgPrice: number;
}

function toFilterOptions(data: unknown): FilterOption[] {
  if (Array.isArray(data)) {
    return (data as Array<{ id: string; name: string }>).map((m) => ({ value: m.id, label: m.name }));
  }
  return [];
}

export function VehiclesClient() {
  const router = useRouter();
  const { toast } = useToast();
  const [data, setData] = React.useState<VehicleRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(VEHICLE_DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [sortColumn, setSortColumn] = React.useState('createdAt');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc');
  const [searchValue, setSearchValue] = React.useState('');
  const [stats, setStats] = React.useState<VehicleStats | null>(null);
  const [statsLoading, setStatsLoading] = React.useState(true);
  const [deleteDialog, setDeleteDialog] = React.useState<VehicleRow | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const { filters, setFilter, clearAll, hasActiveFilters, activeCount } = useFilters();
  const { selected, toggleAll, clearSelection, selectedCount, selectedIds } =
    useBulkSelection<VehicleRow>(data);

  const [makes, setMakes] = React.useState<FilterOption[]>([]);
  const [modelsList, setModelsList] = React.useState<FilterOption[]>([]);
  const [bodyTypes, setBodyTypes] = React.useState<FilterOption[]>([]);
  const [fuelTypes, setFuelTypes] = React.useState<FilterOption[]>([]);
  const [transmissions, setTransmissions] = React.useState<FilterOption[]>([]);
  const [driveTypes, setDriveTypes] = React.useState<FilterOption[]>([]);
  const [countries, setCountries] = React.useState<FilterOption[]>([]);
  const [colors, setColors] = React.useState<FilterOption[]>([]);

  const filtersLoadedRef = React.useRef(false);
  const [trigger, setTrigger] = React.useState(0);
  const filtersKey = JSON.stringify(filters);

  const paramsRef = React.useRef<{ page: number; pageSize: number; sortColumn: string; sortDirection: 'asc' | 'desc'; searchValue: string; filters: Record<string, unknown> }>({
    page, pageSize, sortColumn, sortDirection, searchValue, filters,
  });
  paramsRef.current = { page, pageSize, sortColumn, sortDirection, searchValue, filters };

  React.useEffect(() => { setTrigger((t) => t + 1); }, [page, pageSize, sortColumn, sortDirection, searchValue, filtersKey]);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setStatsLoading(true);
    setError(null);
    try {
      const p = paramsRef.current;
      const yearRange = p.filters.year as { min?: number; max?: number } | undefined;
      const priceRange = p.filters.price as { min?: number; max?: number } | undefined;

      const params: VehicleListParams = {
        page: p.page,
        limit: p.pageSize,
        sortColumn: p.sortColumn,
        sortDirection: p.sortDirection,
        search: p.searchValue || undefined,
        status: (p.filters.status as VehicleStatus) || undefined,
        manufacturerId: (p.filters.manufacturerId as string) || undefined,
        modelId: (p.filters.modelId as string) || undefined,
        bodyTypeId: (p.filters.bodyTypeId as string) || undefined,
        fuelTypeId: (p.filters.fuelTypeId as string) || undefined,
        transmissionId: (p.filters.transmissionId as string) || undefined,
        driveTypeId: (p.filters.driveTypeId as string) || undefined,
        countryId: (p.filters.countryId as string) || undefined,
        colorId: (p.filters.colorId as string) || undefined,
        yearMin: yearRange?.min,
        yearMax: yearRange?.max,
        priceMin: priceRange?.min,
        priceMax: priceRange?.max,
        mileageMax: (p.filters.mileageMax as { min?: number; max?: number })?.max,
        isFeatured: p.filters.isFeatured === true || p.filters.isFeatured === 'true' ? true : undefined,
      };

      const result = await getVehicleListPageData(params);
      if (result.success && result.data) {
        const d = result.data as {
          vehicles: { data: VehicleRow[]; meta: { total: number; totalPages: number } };
          stats: VehicleStats;
          manufacturers: unknown;
          models: unknown;
          bodyTypes: unknown;
          fuelTypes: unknown;
          transmissions: unknown;
          driveTypes: unknown;
          colors: unknown;
          countries: unknown;
        };

        setData(d.vehicles.data);
        setTotal(d.vehicles.meta.total);
        setTotalPages(d.vehicles.meta.totalPages);
        setStats(d.stats);

        if (!filtersLoadedRef.current) {
          filtersLoadedRef.current = true;
          setMakes(toFilterOptions(d.manufacturers));
          setModelsList(toFilterOptions(d.models));
          setBodyTypes(toFilterOptions(d.bodyTypes));
          setFuelTypes(toFilterOptions(d.fuelTypes));
          setTransmissions(toFilterOptions(d.transmissions));
          setDriveTypes(toFilterOptions(d.driveTypes));
          setColors(toFilterOptions(d.colors));
          setCountries(toFilterOptions(d.countries));
        }
      } else {
        setError(!result.success ? result.error : 'Failed to load vehicles');
      }
    } catch {
      setError('Failed to load vehicles');
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  }, []);

  React.useEffect(() => { loadData(); }, [trigger, loadData]);

  async function handleDelete() {
    if (!deleteDialog) return;
    setDeleting(true);
    try {
      const result = await softDeleteVehicle(deleteDialog.id);
      if (result.success) {
        toast({ title: 'Vehicle deleted', variant: 'success' });
        setDeleteDialog(null);
        loadData();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'error' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete vehicle', variant: 'error' });
    } finally {
      setDeleting(false);
    }
  }

  async function handleDuplicate(id: string) {
    try {
      const result = await duplicateVehicle(id);
      if (result.success) {
        toast({ title: 'Vehicle duplicated', variant: 'success' });
        loadData();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'error' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to duplicate vehicle', variant: 'error' });
    }
  }

  function handleCopyUrl(id: string) {
    navigator.clipboard.writeText(`${window.location.origin}/vehicles/${id}`);
    toast({ title: 'Copied', description: 'Vehicle URL copied to clipboard', variant: 'success' });
  }

  function handleSelectionChange(newSelected: Set<string>) {
    toggleAll(data.filter((row) => newSelected.has(row.id)));
  }

  const columns: ColumnDef<VehicleRow>[] = React.useMemo(
    () => [
      {
        id: 'image',
        header: '',
        className: 'w-12',
        cell: (row) => (
          <div className="size-10 overflow-hidden rounded-[6px] border border-iron/30 bg-deep-carbon">
            {row.primaryImageUrl ? (
              <img src={row.primaryImageUrl} alt="" className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center">
                <Car className="size-4 text-steel" />
              </div>
            )}
          </div>
        ),
      },
      {
        id: 'stockNumber',
        header: 'Stock #',
        accessorKey: 'stockNumber',
        sortable: true,
        cell: (row) => (
          <span className="font-mono text-xs text-pure-white">{row.stockNumber ?? '—'}</span>
        ),
      },
      {
        id: 'vehicle',
        header: 'Vehicle',
        cell: (row) => (
          <div className="min-w-[180px]">
            <p className="text-sm font-medium text-pure-white">
              {row.year ? `${row.year} ` : ''}
              {row._manufacturerName ?? 'Unknown'} {row._modelName ?? ''}
            </p>
            {row.vin && (
              <p className="text-xs text-steel font-mono truncate max-w-[180px]">{row.vin}</p>
            )}
          </div>
        ),
      },
      {
        id: 'year',
        header: 'Year',
        accessorKey: 'year',
        sortable: true,
        cell: (row) =>
          row.year != null ? (
            <span className="text-sm text-pure-white">{row.year}</span>
          ) : (
            <span className="text-steel">—</span>
          ),
      },
      {
        id: 'price',
        header: 'Price',
        accessorKey: 'price',
        sortable: true,
        cell: (row) =>
          row.price != null ? (
            <span className="text-sm font-medium text-pure-white">{formatPrice(row.price)}</span>
          ) : (
            <span className="text-steel">—</span>
          ),
      },
      {
        id: 'country',
        header: 'Country',
        accessorKey: '_countryName',
        cell: (row) => (
          <span className="text-sm text-ash">{row._countryName ?? '—'}</span>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        accessorKey: 'status',
        sortable: true,
        cell: (row) => (
          <StatusChip
            label={VEHICLE_STATUS_CONFIG[row.status as keyof typeof VEHICLE_STATUS_CONFIG]?.label ?? row.status}
            variant={getStatusVariant(row.status)}
          />
        ),
      },
      {
        id: 'createdAt',
        header: 'Added',
        accessorKey: 'createdAt',
        sortable: true,
        cell: (row) => (
          <span className="text-xs text-steel">
            {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        className: 'w-10',
        cell: (row) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon-xs">
                <MoreVertical className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-carbon border-iron">
              <DropdownMenuItem onClick={() => router.push(`/admin/vehicles/${row.id}`)}>
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/admin/vehicles/${row.id}/edit`)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDuplicate(row.id)}>
                <Copy className="mr-2 size-3.5" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCopyUrl(row.id)}>
                <ExternalLink className="mr-2 size-3.5" /> Copy URL
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-iron/30" />
              <DropdownMenuItem
                className="text-signal-red focus:text-signal-red"
                onClick={() => setDeleteDialog(row)}
              >
                <Trash2 className="mr-2 size-3.5" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [router],
  );

  const filterConfigs: FilterConfig[] = React.useMemo(
    () => [
      { id: 'status', label: 'Status', type: 'select', options: VEHICLE_STATUS_OPTIONS },
      { id: 'isFeatured', label: 'Featured', type: 'boolean' },
      { id: 'manufacturerId', label: 'Make', type: 'select', options: makes },
      { id: 'modelId', label: 'Model', type: 'select', options: modelsList },
      { id: 'bodyTypeId', label: 'Body Type', type: 'select', options: bodyTypes },
      { id: 'fuelTypeId', label: 'Fuel Type', type: 'select', options: fuelTypes },
      { id: 'transmissionId', label: 'Transmission', type: 'select', options: transmissions },
      { id: 'driveTypeId', label: 'Drive Type', type: 'select', options: driveTypes },
      { id: 'countryId', label: 'Country', type: 'select', options: countries },
      { id: 'colorId', label: 'Color', type: 'select', options: colors },
      { id: 'year', label: 'Year', type: 'number-range' },
      { id: 'price', label: 'Price', type: 'number-range' },
      { id: 'mileageMax', label: 'Max Mileage', type: 'number-range' },
    ],
    [makes, modelsList, bodyTypes, fuelTypes, transmissions, driveTypes, countries, colors],
  );

  const bulkActions: BulkAction[] = React.useMemo(
    () => [
      {
        label: 'Publish',
        action: async (ids) => {
          const result = await bulkUpdateVehicleStatus(ids, 'active');
          if (result.success) { loadData(); } else { throw new Error(result.error); }
        },
      },
      {
        label: 'Archive',
        action: async (ids) => {
          const result = await bulkUpdateVehicleStatus(ids, 'archived');
          if (result.success) { loadData(); } else { throw new Error(result.error); }
        },
      },
      {
        label: 'Duplicate',
        action: async (ids) => {
          const result = await bulkDuplicateVehicles(ids);
          if (result.success) { loadData(); } else { throw new Error(result.error); }
        },
      },
      {
        label: 'Restore',
        action: async (ids) => {
          const result = await bulkRestoreVehicles(ids);
          if (result.success) { loadData(); } else { throw new Error(result.error); }
        },
      },
      {
        label: 'Export CSV',
        action: async (ids) => {
          const selected = data.filter((row) => ids.includes(row.id));
          const headers = ['Stock #', 'VIN', 'Year', 'Make', 'Model', 'Status', 'Price', 'Mileage'];
          const rows = selected.map((row) => [
            row.stockNumber ?? '', row.vin ?? '', row.year?.toString() ?? '',
            row._manufacturerName ?? '', row._modelName ?? '', row.status ?? '',
            row.price?.toString() ?? '', row.mileage?.toString() ?? '',
          ]);
          const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `vehicles-${new Date().toISOString().split('T')[0]}.csv`;
          a.click();
          URL.revokeObjectURL(url);
          toast({ title: 'Export complete', description: `${ids.length} vehicles exported`, variant: 'success' });
        },
      },
      {
        label: 'Delete',
        variant: 'destructive',
        confirmMessage: 'Are you sure you want to delete selected vehicles? This action cannot be undone.',
        action: async (ids) => {
          const result = await bulkDeleteVehicles(ids);
          if (result.success) { loadData(); } else { throw new Error(result.error); }
        },
      },
    ],
    [loadData, data, toast],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vehicles"
        description="Manage your vehicle inventory"
        action={{ label: 'Add Vehicle', href: '/admin/vehicles/new', icon: Plus }}
      />

      {/* Stat Cards */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {statsLoading ? (
          <>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-[10px] border border-iron/30 bg-carbon p-4">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-7 w-12" />
                </div>
              </div>
            ))}
          </>
        ) : stats ? (
          <>
            <StatCard title="Total" value={stats.total} icon="Car" variant="compact" />
            <StatCard title="Active" value={stats.active} icon="Check" variant="compact" color="text-available-green" />
            <StatCard title="Draft" value={stats.draft} icon="FileText" variant="compact" color="text-steel" />
            <StatCard title="Sold" value={stats.sold} icon="DollarSign" variant="compact" color="text-auction-amber" />
            <StatCard title="Archived" value={stats.archived} icon="Package" variant="compact" color="text-ash" />
          </>
        ) : null}
      </div>

      {/* Filters */}
      <FilterBar
        filters={filterConfigs}
        values={filters}
        onChange={(id, value) => setFilter(id, value)}
        onClear={clearAll}
      />

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-ash">
          {loading ? (
            'Loading vehicles...'
          ) : (
            <>
              <span className="font-medium text-pure-white">{total}</span> vehicle{total === 1 ? '' : 's'}
              {hasActiveFilters && (
                <span className="text-steel"> (filtered{activeCount > 0 ? ` · ${activeCount} filter${activeCount === 1 ? '' : 's'}` : ''})</span>
              )}
            </>
          )}
        </p>
      </div>

      {/* Error State */}
      {error && !loading && (
        <div className="rounded-[10px] border border-signal-red/30 bg-signal-red/5 p-6 text-center">
          <p className="text-sm text-signal-red">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={loadData}>
            Retry
          </Button>
        </div>
      )}

      {/* Table */}
      {!error && (
        <DataTable
          columns={columns as unknown as ColumnDef<Record<string, unknown>>[]}
          data={data as unknown as Record<string, unknown>[]}
          total={total}
          page={page}
          pageSize={pageSize}
          totalPages={totalPages}
          loading={loading}
          searchPlaceholder="Search by VIN, stock #, make, model..."
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          onSortChange={(col, dir) => {
            setSortColumn(col);
            setSortDirection(dir);
          }}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          selectedRows={selected}
          onSelectionChange={handleSelectionChange}
          emptyTitle="No vehicles found"
          emptyDescription={
            hasActiveFilters
              ? 'Try changing your filters or search terms.'
              : 'Add your first vehicle to get started.'
          }
          emptyIcon={Car}
          getRowId={(row) => (row as unknown as VehicleRow).id}
          onRowClick={(row) => router.push(`/admin/vehicles/${(row as unknown as VehicleRow).id}`)}
        />
      )}

      {/* Bulk Actions */}
      {selectedCount > 0 && (
        <BulkActionBar
          selectedCount={selectedCount}
          selectedIds={selectedIds}
          actions={bulkActions}
          onClearSelection={clearSelection}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteDialog}
        onOpenChange={() => setDeleteDialog(null)}
        title="Delete Vehicle"
        description={`Are you sure you want to delete this vehicle? This action cannot be undone.`}
        variant="destructive"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
