'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  SlidersHorizontal,
  X,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmptyState } from '../ui/empty-state';
import { TableRowSkeleton } from '../ui/skeletons';

export interface ColumnDef<T> {
  id: string;
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  searchable?: boolean;
  className?: string;
  hidden?: boolean;
}

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterConfig {
  id: string;
  label: string;
  options: FilterOption[];
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  loading?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onSortChange?: (column: string, direction: 'asc' | 'desc') => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  filters?: FilterConfig[];
  activeFilters?: Record<string, string>;
  onFilterChange?: (filterId: string, value: string) => void;
  onClearFilters?: () => void;
  selectedRows?: Set<string>;
  onSelectionChange?: (selected: Set<string>) => void;
  onBulkAction?: (action: string, selected: string[]) => void;
  bulkActions?: { label: string; value: string }[];
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: React.ComponentType<{ className?: string }>;
  getRowId?: (row: T) => string;
  onRowClick?: (row: T) => void;
}

function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  total,
  page,
  pageSize,
  totalPages,
  loading = false,
  searchPlaceholder = 'Search...',
  searchValue = '',
  onSearchChange,
  onPageChange,
  onPageSizeChange,
  onSortChange,
  sortColumn,
  sortDirection = 'desc',
  filters = [],
  activeFilters = {},
  onFilterChange,
  onClearFilters,
  selectedRows = new Set(),
  onSelectionChange,
  onBulkAction,
  bulkActions = [],
  emptyTitle,
  emptyDescription,
  emptyIcon,
  getRowId = (row: T) => row.id as string,
  onRowClick,
}: DataTableProps<T>) {
  const [localSearch, setLocalSearch] = React.useState(searchValue);

  const visibleColumns = React.useMemo(
    () => columns.filter((col) => !col.hidden),
    [columns]
  );

  const hasActiveFilters = Object.values(activeFilters).some(
    (v) => v && v !== 'all' && v !== ''
  );

  const allSelected = data.length > 0 && data.every((row) => selectedRows.has(getRowId(row)));
  const someSelected = data.some((row) => selectedRows.has(getRowId(row)));

  function handleSearchChange(value: string) {
    setLocalSearch(value);
    onSearchChange?.(value);
  }

  function handleSelectAll(checked: boolean) {
    if (!onSelectionChange) return;
    if (checked) {
      const newSelected = new Set(selectedRows);
      data.forEach((row) => newSelected.add(getRowId(row)));
      onSelectionChange(newSelected);
    } else {
      const newSelected = new Set(selectedRows);
      data.forEach((row) => newSelected.delete(getRowId(row)));
      onSelectionChange(newSelected);
    }
  }

  function handleSelectRow(id: string, checked: boolean) {
    if (!onSelectionChange) return;
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    onSelectionChange(newSelected);
  }

  function handleSort(column: string) {
    if (!onSortChange) return;
    if (sortColumn === column) {
      onSortChange(column, sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(column, 'asc');
    }
  }

  const formatCell = (value: unknown): string => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (value instanceof Date) return value.toLocaleDateString();
    return String(value);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-steel" />
            <Input
              placeholder={searchPlaceholder}
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 bg-deep-carbon border-iron/30 text-pure-white placeholder:text-steel"
            />
            {localSearch && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-steel hover:text-pure-white"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {filters.map((filter) => (
            <Select
              key={filter.id}
              value={activeFilters[filter.id] ?? 'all'}
              onValueChange={(value) => onFilterChange?.(filter.id, value)}
            >
              <SelectTrigger className="w-[140px] bg-deep-carbon border-iron/30">
                <SelectValue placeholder={filter.label} />
              </SelectTrigger>
              <SelectContent className="bg-carbon border-iron">
                <SelectItem value="all">All {filter.label}</SelectItem>
                {filter.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-ash hover:text-pure-white"
            >
              <X className="mr-1 size-3" />
              Clear filters
            </Button>
          )}
        </div>

        {selectedRows.size > 0 && bulkActions.length > 0 && (
          <div className="flex items-center gap-2 rounded-[6px] border border-signal-red/20 bg-signal-red/5 px-3 py-2">
            <span className="text-sm text-signal-red font-medium">
              {selectedRows.size} selected
            </span>
            {bulkActions.map((action) => (
              <Button
                key={action.value}
                variant="ghost"
                size="sm"
                onClick={() => onBulkAction?.(action.value, Array.from(selectedRows))}
                className="h-7 text-xs text-pure-white hover:bg-signal-red/20"
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-[10px] border border-iron/30 bg-carbon overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-iron/30 hover:bg-transparent">
              {onSelectionChange && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    ref={(el) => {
                      if (el) (el as HTMLInputElement).indeterminate = someSelected && !allSelected;
                    }}
                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                  />
                </TableHead>
              )}
              {visibleColumns.map((column) => (
                <TableHead
                  key={column.id}
                  className={cn(
                    'text-pure-white',
                    column.sortable && 'cursor-pointer select-none hover:text-signal-red',
                    column.className
                  )}
                  onClick={() => column.sortable && handleSort(column.id)}
                >
                  <div className="flex items-center gap-1">
                    {column.header}
                    {column.sortable && sortColumn === column.id && (
                      <span className="text-signal-red">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRowSkeleton key={i} columns={visibleColumns.length + (onSelectionChange ? 1 : 0)} />
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length + (onSelectionChange ? 1 : 0)}
                  className="h-48 text-center"
                >
                  <EmptyState
                    title={emptyTitle ?? 'No results'}
                    description={emptyDescription ?? 'No records match your search or filters.'}
                    icon={emptyIcon}
                  />
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => {
                const rowId = getRowId(row);
                return (
                  <TableRow
                    key={rowId ?? index}
                    className={cn(
                      'border-iron/30',
                      onRowClick && 'cursor-pointer',
                      selectedRows.has(rowId) && 'bg-signal-red/5'
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {onSelectionChange && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedRows.has(rowId)}
                          onCheckedChange={(checked) => handleSelectRow(rowId, !!checked)}
                        />
                      </TableCell>
                    )}
                    {visibleColumns.map((column) => (
                      <TableCell key={column.id} className={column.className}>
                        {column.cell
                          ? column.cell(row)
                          : formatCell(row[column.accessorKey ?? column.id])}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-ash">
            <span>Showing</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => onPageSizeChange?.(Number(value))}
            >
              <SelectTrigger className="h-8 w-[70px] bg-deep-carbon border-iron/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-carbon border-iron">
                {[10, 20, 50, 100].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>of {total} results</span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-8 border-iron/30 text-ash hover:text-pure-white"
              onClick={() => onPageChange?.(1)}
              disabled={page <= 1}
            >
              <ChevronsLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8 border-iron/30 text-ash hover:text-pure-white"
              onClick={() => onPageChange?.(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="size-4" />
            </Button>

            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? 'default' : 'outline'}
                  size="icon"
                  className={cn(
                    'size-8',
                    page === pageNum
                      ? 'bg-signal-red text-pure-white hover:bg-deep-red border-signal-red'
                      : 'border-iron/30 text-ash hover:text-pure-white'
                  )}
                  onClick={() => onPageChange?.(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}

            <Button
              variant="outline"
              size="icon"
              className="size-8 border-iron/30 text-ash hover:text-pure-white"
              onClick={() => onPageChange?.(page + 1)}
              disabled={page >= totalPages}
            >
              <ChevronRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8 border-iron/30 text-ash hover:text-pure-white"
              onClick={() => onPageChange?.(totalPages)}
              disabled={page >= totalPages}
            >
              <ChevronsRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export { DataTable };
