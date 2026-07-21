export default function Loading() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-steel border-t-transparent rounded-full animate-spin"></div>
        <p className="text-ash font-medium uppercase tracking-wider text-sm">Loading...</p>
      </div>
    </div>
  );
}
