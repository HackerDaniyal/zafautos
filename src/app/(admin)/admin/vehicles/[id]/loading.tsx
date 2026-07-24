export default function VehicleDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-64 animate-pulse rounded bg-iron/20" />
          <div className="h-4 w-48 animate-pulse rounded bg-iron/20" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-20 animate-pulse rounded bg-iron/20" />
          <div className="h-9 w-20 animate-pulse rounded bg-iron/20" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-[10px] bg-iron/20" />
        ))}
      </div>
      <div className="h-96 animate-pulse rounded-[10px] bg-iron/20" />
    </div>
  );
}
