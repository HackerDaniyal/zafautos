'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
      <h2 className="text-xl font-bold text-pure-white">Something went wrong</h2>
      <p className="mt-2 text-sm text-ash">{error.message}</p>
      <div className="mt-6 flex gap-3">
        <Button variant="outline" onClick={reset} className="border-iron/30 text-pure-white">
          Try again
        </Button>
        <Button asChild className="bg-signal-red text-pure-white hover:bg-deep-red">
          <Link href="/admin">Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
