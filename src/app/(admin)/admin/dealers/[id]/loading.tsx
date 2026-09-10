export default function DealerDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 animate-pulse rounded bg-surface-2" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="h-48 animate-pulse rounded-[10px] bg-surface-2" />
        <div className="h-48 animate-pulse rounded-[10px] bg-surface-2" />
      </div>
      <div className="h-64 animate-pulse rounded-[10px] bg-surface-2" />
    </div>
  );
}
