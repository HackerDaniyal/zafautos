'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
      <h2 className="font-display text-4xl font-bold uppercase mb-4">Something went wrong!</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        We encountered an unexpected error while processing your request. Please try again.
      </p>
      <button
        onClick={() => reset()}
        className="bg-primary text-primary-foreground px-6 py-3 rounded-md font-medium uppercase text-sm tracking-wide hover:bg-destructive transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
