'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Car, Plus, Eye, Pencil, ExternalLink, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, type ColumnDef } from '@/components/admin/table/data-table';
import { FilterBar, type FilterConfig } from '@/components/admin/filters/filter-bar';
import { useFilters } from '@/components/admin/filters/use-filters';
import { useBulkSelection } from '@/components/admin/bulk/use-bulk-selection';
import { BulkActionBar, type BulkAction } from '@/components/admin/bulk/bulk-action-bar';
import { PageHeader } from '@/components/admin/ui/page-header';
import { useToast } from '@/components/admin/ui/use-toast';
import {
  listVehiclesForAdmin,
  bulkDeleteVehicles,
  bulkUpdateVehicleStatus,
  bulkDuplicateVehicles,
  bulkRestoreVehicles,
  listManufacturers,
  listModels,
  listBodyTypes,
  listFuelTypes,
  listTransmissions,
  listDriveTypes,
  listCountries,
} from '@/server/actions/vehicleActions';
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

export function VehiclesClient() {
  const router = useRouter();
  const { toast } = useToast();
  const [data, setData] = React.useState<VehicleRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(VEHICLE_DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [sortColumn, setSortColumn] = React.useState('createdAt');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc');
  const [searchValue, setSearchValue] = React.useState('');
  const { filters, setFilter, clearAll } = useFilters();
  const { selected, toggleAll, clearSelection, selectedCount, selectedIds } =
    useBulkSelection<VehicleRow>(data);

  const [makes, setMakes] = React.useState<FilterOption[]>([]);
  const [modelsList, setModelsList] = React.useState<FilterOption[]>([]);
  const [bodyTypes, setBodyTypes] = React.useState<FilterOption[]>([]);
  const [fuelTypes, setFuelTypes] = React.useState<FilterOption[]>([]);
  const [transmissions, setTransmissions] = React.useState<FilterOption[]>([]);
  const [driveTypes, setDriveTypes] = React.useState<FilterOption[]>([]);
  const [countries, setCountries] = React.useState<FilterOption[]>([]);

  React.useEffect(() => {
    async function loadFilters() {
      const [makesRes, modelsRes, bodyRes, fuelRes, transRes, driveRes, countryRes] =
        await Promise.all([
          listManufacturers(),
          listModels(),
          listBodyTypes(),
          listFuelTypes(),
          listTransmissions(),
          listDriveTypes(),
          listCountries(),
        ]);
      if (makesRes.success && makesRes.data) setMakes((makesRes.data as Array<{ id: string; name: string }>).map((m) => ({ value: m.id, label: m.name })));
      if (modelsRes.success && modelsRes.data) setModelsList((modelsRes.data as Array<{ id: string; name: string }>).map((m) => ({ value: m.id, label: m.name })));
      if (bodyRes.success && bodyRes.data) setBodyTypes((bodyRes.data as Array<{ id: string; name: string }>).map((b) => ({ value: b.id, label: b.name })));
      if (fuelRes.success && fuelRes.data) setFuelTypes((fuelRes.data as Array<{ id: string; name: string }>).map((f) => ({ value: f.id, label: f.name })));
      if (transRes.success && transRes.data) setTransmissions((transRes.data as Array<{ id: string; name: string }>).map((t) => ({ value: t.id, label: t.name })));
      if (driveRes.success && driveRes.data) setDriveTypes((driveRes.data as Array<{ id: string; name: string }>).map((d) => ({ value: d.id, label: d.name })));
      if (countryRes.success && countryRes.data) setCountries((countryRes.data as Array<{ id: string; name: string }>).map((c) => ({ value: c.id, label: c.name })));
    }
    loadFilters();
  }, []);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const yearRange = filters.year as { min?: number; max?: number } | undefined;
      const priceRange = filters.price as { min?: number; max?: number } | undefined;

      const params: VehicleListParams = {
        page,
        limit: pageSize,
        sortColumn,
        sortDirection,
        search: searchValue || undefined,
        status: (filters.status as VehicleStatus) || undefined,
        manufacturerId: (filters.manufacturerId as string) || undefined,
        modelId: (filters.modelId as string) || undefined,
        bodyTypeId: (filters.bodyTypeId as string) || undefined,
        fuelTypeId: (filters.fuelTypeId as string) || undefined,
        transmissionId: (filters.transmissionId as string) || undefined,
        driveTypeId: (filters.driveTypeId as string) || undefined,
        countryId: (filters.countryId as string) || undefined,
        yearMin: yearRange?.min,
        yearMax: yearRange?.max,
        priceMin: priceRange?.min,
        priceMax: priceRange?.max,
        isFeatured: filters.isFeatured === true || filters.isFeatured === 'true' ? true : undefined,
      };
      const result = await listVehiclesForAdmin(params);
      if (result.success) {
        const res = result.data as { data: VehicleRow[]; meta: { total: number; totalPages: number } };
        setData(res.data);
        setTotal(res.meta.total);
        setTotalPages(res.meta.totalPages);
      } else {
        toast({ title: 'Error', description: result.error, variant: 'error' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load vehicles', variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortColumn, sortDirection, searchValue, filters, toast]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleSelectionChange(newSelected: Set<string>) {
    toggleAll(data.filter((row) => newSelected.has(row.id)));
  }

  const columns: ColumnDef<VehicleRow>[] = React.useMemo(
    () => [
      {
        id: 'image',
        header: '',
        cell: () => (
          <div className="flex size-10 items-center justify-center rounded-[6px] border border-iron/30 bg-deep-carbon">
            <Car className="size-4 text-steel" />
          </div>
        ),
      },
      {
        id: 'stockNumber',
        header: 'Stock #',
        accessorKey: 'stockNumber',
        sortable: true,
        cell: (row) => (
          <span className="font-mono text-xs text-pure-white">
            {row.stockNumber ?? '—'}
          </span>
        ),
      },
      {
        id: 'vehicle',
        header: 'Vehicle',
        cell: (row) => (
          <div className="min-w-[200px]">
            <p className="text-sm font-medium text-pure-white">
              {row.year ? `${row.year} ` : ''}
              {row._manufacturerName ?? ''} {row._modelName ?? ''}
            </p>
            {row.vin && (
              <p className="text-xs text-steel font-mono">{row.vin}</p>
            )}
          </div>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        accessorKey: 'status',
        sortable: true,
        cell: (row) => {
          const config = VEHICLE_STATUS_CONFIG[row.status as keyof typeof VEHICLE_STATUS_CONFIG];
          return config ? (
            <Badge
              variant="outline"
              className={`${config.bgColor} ${config.color} border-transparent`}
            >
              <span className={`mr-1.5 size-1.5 rounded-full ${config.dotColor}`} />
              {config.label}
            </Badge>
          ) : (
            <span className="text-steel">—</span>
          );
        },
      },
      {
        id: 'price',
        header: 'Price',
        accessorKey: 'price',
        sortable: true,
        cell: (row) =>
          row.price != null ? (
            <span className="text-sm text-pure-white">
              ${row.price.toLocaleString()}
            </span>
          ) : (
            <span className="text-steel">—</span>
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
        id: 'mileage',
        header: 'Mileage',
        accessorKey: 'mileage',
        sortable: true,
        cell: (row) =>
          row.mileage != null ? (
            <span className="text-sm text-pure-white">
              {row.mileage.toLocaleString()} km
            </span>
          ) : (
            <span className="text-steel">—</span>
          ),
      },
      {
        id: 'featured',
        header: 'Featured',
        accessorKey: 'isFeatured',
        cell: (row) =>
          row.isFeatured ? (
            <Star className="size-4 fill-auction-amber text-auction-amber" />
          ) : null,
      },
      {
        id: 'actions',
        header: '',
        cell: (row) => (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => router.push(`/admin/vehicles/${row.id}`)}
            >
              <Eye className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => router.push(`/admin/vehicles/${row.id}/edit`)}
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => handleCopyUrl(row.id)}
            >
              <ExternalLink className="size-3.5" />
            </Button>
          </div>
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
      { id: 'year', label: 'Year', type: 'number-range' },
      { id: 'price', label: 'Price', type: 'number-range' },
    ],
    [makes, modelsList, bodyTypes, fuelTypes, transmissions, driveTypes, countries],
  );

  const bulkActions: BulkAction[] = React.useMemo(
    () => [
      {
        label: 'Publish',
        action: async (ids) => {
          const result = await bulkUpdateVehicleStatus(ids, 'active');
          if (result.success) {
            fetchData();
          } else {
            throw new Error(result.error);
          }
        },
      },
      {
        label: 'Archive',
        action: async (ids) => {
          const result = await bulkUpdateVehicleStatus(ids, 'archived');
          if (result.success) {
            fetchData();
          } else {
            throw new Error(result.error);
          }
        },
      },
      {
        label: 'Duplicate',
        action: async (ids) => {
          const result = await bulkDuplicateVehicles(ids);
          if (result.success) {
            fetchData();
          } else {
            throw new Error(result.error);
          }
        },
      },
      {
        label: 'Restore',
        action: async (ids) => {
          const result = await bulkRestoreVehicles(ids);
          if (result.success) {
            fetchData();
          } else {
            throw new Error(result.error);
          }
        },
      },
      {
        label: 'Export CSV',
        action: async (ids) => {
          const selected = data.filter((row) => ids.includes(row.id));
          const headers = ['Stock #', 'VIN', 'Year', 'Make', 'Model', 'Status', 'Price', 'Mileage'];
          const rows = selected.map((row) => [
            row.stockNumber ?? '',
            row.vin ?? '',
            row.year?.toString() ?? '',
            row._manufacturerName ?? '',
            row._modelName ?? '',
            row.status ?? '',
            row.price?.toString() ?? '',
            row.mileage?.toString() ?? '',
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
          if (result.success) {
            fetchData();
          } else {
            throw new Error(result.error);
          }
        },
      },
    ],
    [fetchData, data, toast],
  );

  function handleCopyUrl(id: string) {
    navigator.clipboard.writeText(`${window.location.origin}/vehicles/${id}`);
    toast({
      title: 'Copied',
      description: 'Vehicle URL copied to clipboard',
      variant: 'success',
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vehicles"
        description="Manage your vehicle inventory"
        action={{ label: 'Add Vehicle', href: '/admin/vehicles/new', icon: Plus }}
      />

      <FilterBar
        filters={filterConfigs}
        values={filters}
        onChange={(id, value) => setFilter(id, value)}
        onClear={clearAll}
      />

      <DataTable
        columns={columns as unknown as ColumnDef<Record<string, unknown>>[]}
        data={data as unknown as Record<string, unknown>[]}
        total={total}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        loading={loading}
        searchPlaceholder="Search vehicles by VIN, stock #..."
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
        emptyTitle="No vehicles"
        emptyDescription="Add your first vehicle to get started."
        emptyIcon={Car}
        getRowId={(row) => (row as unknown as VehicleRow).id}
        onRowClick={(row) => router.push(`/admin/vehicles/${(row as unknown as VehicleRow).id}`)}
      />

      {selectedCount > 0 && (
        <BulkActionBar
          selectedCount={selectedCount}
          selectedIds={selectedIds}
          actions={bulkActions}
          onClearSelection={clearSelection}
        />
      )}
    </div>
  );
}
