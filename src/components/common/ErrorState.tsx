import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ 
  title = 'Something went wrong', 
  message = 'An error occurred while loading this content. Please try again.',
  onRetry,
  className
}: ErrorStateProps) {
  return (
    <div className={`flex min-h-[400px] flex-col items-center justify-center p-8 text-center ${className || ''}`}>
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-6">
        <AlertCircle className="h-10 w-10" />
      </div>
      <h2 className="mb-2 text-xl font-semibold">{title}</h2>
      <p className="mb-6 max-w-[400px] text-sm text-muted-foreground">
        {message}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          Try Again
        </Button>
      )}
    </div>
  );
}
