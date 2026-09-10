'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OrderDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
      <p className="text-lg font-medium text-pure-white">Something went wrong</p>
      <p className="mt-2 text-sm text-ash">
        {error.message || 'An unexpected error occurred while loading the order.'}
      </p>
      <div className="mt-4 flex gap-2">
        <Button variant="outline" asChild>
          <Link href="/admin/orders">
            <ArrowLeft className="mr-1 size-4" />
            Back to Orders
          </Link>
        </Button>
        <Button onClick={reset}>Try Again</Button>
      </div>
    </div>
  );
}
