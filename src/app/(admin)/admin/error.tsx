'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg text-center">
        <AlertTriangle className="mx-auto mb-6 size-16 text-signal-red" />
        <h2 className="font-[Oswald] text-3xl font-bold uppercase tracking-wider text-pure-white">
          Something went wrong
        </h2>
        <p className="mt-3 text-ash">
          An unexpected error occurred while processing your request.
        </p>

        {error.message && (
          <p className="mt-2 rounded-[6px] border border-iron bg-deep-carbon px-4 py-2 text-sm text-pure-white">
            {error.message}
          </p>
        )}

        {error.digest && (
          <p className="mt-2 text-xs text-steel">
            Error ID: {error.digest}
          </p>
        )}

        <div className="mt-6 flex justify-center gap-3">
          <Button
            variant="outline"
            onClick={reset}
            className="border-iron text-pure-white"
          >
            Try again
          </Button>
          <Button asChild className="bg-signal-red text-pure-white hover:bg-deep-red">
            <Link href="/admin">Return to Dashboard</Link>
          </Button>
        </div>

        <button
          onClick={() => setShowDetails(!showDetails)}
          className={cn(
            'mt-6 inline-flex items-center gap-1.5 text-sm text-ash transition-colors hover:text-pure-white',
          )}
        >
          {showDetails ? (
            <ChevronUp className="size-4" />
          ) : (
            <ChevronDown className="size-4" />
          )}
          {showDetails ? 'Hide details' : 'Show details'}
        </button>

        {showDetails && (
          <pre className="mt-4 max-h-60 overflow-auto rounded-[6px] border border-iron bg-deep-carbon p-4 text-left text-xs text-ash">
            {error.stack || error.message}
          </pre>
        )}
      </div>
    </div>
  );
}
