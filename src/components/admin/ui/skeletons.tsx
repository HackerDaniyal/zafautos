import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('animate-pulse rounded-[6px] bg-iron/50', className)}
      {...props}
    />
  );
}

function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-[10px] border border-iron/30 bg-carbon p-6', className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-10 w-10 rounded-[6px]" />
      </div>
    </div>
  );
}

function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b border-iron/30">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-2">
          <Skeleton className="h-5 w-full" />
        </td>
      ))}
    </tr>
  );
}

function PageHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-9 w-32 rounded-[6px]" />
    </div>
  );
}

export { Skeleton, StatCardSkeleton, TableRowSkeleton, PageHeaderSkeleton };
