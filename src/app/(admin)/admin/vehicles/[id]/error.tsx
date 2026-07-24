'use client';

export default function VehicleDetailError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
      <p className="text-lg font-medium text-pure-white">Something went wrong</p>
      <p className="mt-2 text-sm text-ash">{error.message}</p>
      <button
        onClick={reset}
        className="mt-4 rounded-[6px] bg-signal-red px-4 py-2 text-sm font-medium text-pure-white hover:bg-deep-red"
      >
        Try again
      </button>
    </div>
  );
}
