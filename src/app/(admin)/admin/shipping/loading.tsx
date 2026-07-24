import { TableRowSkeleton, PageHeaderSkeleton } from '@/components/admin/ui/skeletons';

export default function ShippingLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <div className="flex items-center gap-3">
        <div className="h-9 w-[200px] animate-pulse rounded-[6px] bg-iron/50" />
        <div className="h-9 w-[160px] animate-pulse rounded-[6px] bg-iron/50" />
        <div className="h-9 w-[280px] animate-pulse rounded-[6px] bg-iron/50" />
      </div>
      <div className="rounded-[10px] border border-iron/30 bg-carbon overflow-hidden">
        <table className="w-full">
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRowSkeleton key={i} columns={7} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
