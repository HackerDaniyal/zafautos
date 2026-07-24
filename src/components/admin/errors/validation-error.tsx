'use client';

import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ValidationErrorProps {
  errors: { field: string; message: string }[];
}

export function ValidationError({ errors }: ValidationErrorProps) {
  if (errors.length === 0) return null;

  const scrollToField = (field: string) => {
    const el = document.querySelector(`[name="${field}"], [data-field="${field}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (el instanceof HTMLElement) el.focus();
    }
  };

  return (
    <div className="rounded-[6px] border border-signal-red/30 bg-signal-red/5 p-4">
      <div className="flex items-center gap-2">
        <AlertCircle className="size-4 text-signal-red" />
        <h3 className="text-sm font-semibold text-pure-white">
          {errors.length} validation {errors.length === 1 ? 'error' : 'errors'} found
        </h3>
      </div>
      <ul className="mt-3 space-y-1.5">
        {errors.map((err) => (
          <li key={err.field}>
            <button
              onClick={() => scrollToField(err.field)}
              className="group flex items-center gap-2 text-left text-sm text-ash transition-colors hover:text-pure-white"
            >
              <span className="font-medium text-signal-red group-hover:underline">
                {err.field}
              </span>
              <span className="text-steel">&mdash;</span>
              <span>{err.message}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
