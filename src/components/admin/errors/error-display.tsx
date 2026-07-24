'use client';

import { useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, RotateCcw, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorDisplayProps {
  title?: string;
  message: string;
  code?: string | number;
  details?: string;
  onRetry?: () => void;
  onBack?: () => void;
}

export function ErrorDisplay({
  title = 'Error',
  message,
  code,
  details,
  onRetry,
  onBack,
}: ErrorDisplayProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="rounded-[6px] border border-signal-red/30 bg-signal-red/5 p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 size-5 shrink-0 text-signal-red" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-pure-white">{title}</h3>
            {code && (
              <span className="rounded bg-signal-red/20 px-1.5 py-0.5 text-xs text-signal-red">
                {code}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-ash">{message}</p>

          {(onRetry || onBack) && (
            <div className="mt-3 flex gap-2">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="inline-flex items-center gap-1.5 rounded-[4px] border border-iron bg-transparent px-3 py-1.5 text-xs font-medium text-pure-white transition-colors hover:bg-white/5"
                >
                  <RotateCcw className="size-3" />
                  Retry
                </button>
              )}
              {onBack && (
                <button
                  onClick={onBack}
                  className="inline-flex items-center gap-1.5 rounded-[4px] border border-iron bg-transparent px-3 py-1.5 text-xs font-medium text-pure-white transition-colors hover:bg-white/5"
                >
                  <ArrowLeft className="size-3" />
                  Back
                </button>
              )}
            </div>
          )}

          {details && (
            <div className="mt-3">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="inline-flex items-center gap-1 text-xs text-ash transition-colors hover:text-pure-white"
              >
                {showDetails ? (
                  <ChevronUp className="size-3" />
                ) : (
                  <ChevronDown className="size-3" />
                )}
                {showDetails ? 'Hide details' : 'Show details'}
              </button>
              {showDetails && (
                <pre className="mt-2 max-h-40 overflow-auto rounded-[4px] border border-iron bg-deep-carbon p-3 text-xs text-ash">
                  {details}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
