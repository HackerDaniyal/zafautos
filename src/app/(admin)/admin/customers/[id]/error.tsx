'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorDisplay } from '@/components/admin/errors/error-display';

export default function CustomerDetailError({
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
      <ErrorDisplay
        title="Customer Error"
        message={error.message || 'An unexpected error occurred while loading the customer.'}
        onRetry={reset}
      />
      <Button variant="outline" asChild className="mt-4">
        <Link href="/admin/customers">
          <ArrowLeft className="mr-1 size-4" />
          Back to Customers
        </Link>
      </Button>
    </div>
  );
}
