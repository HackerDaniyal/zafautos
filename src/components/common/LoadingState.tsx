import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({ message = 'Loading...', className }: LoadingStateProps) {
  return (
    <div className={`flex min-h-[400px] flex-col items-center justify-center p-8 ${className || ''}`}>
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      {message && <p className="mt-4 text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}
