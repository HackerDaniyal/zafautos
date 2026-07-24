'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface DetailFieldData {
  label: string;
  value: React.ReactNode;
  copyable?: boolean;
  mono?: boolean;
}

interface DetailGroupProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

interface DetailGridProps {
  fields: DetailFieldData[];
  columns?: 2 | 3 | 4;
  className?: string;
}

interface DetailActionsProps {
  children: React.ReactNode;
  className?: string;
}

function DetailGroup({ title, children, className }: DetailGroupProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-ash">
        {title}
      </h4>
      <div className="rounded-[6px] border border-iron/30 bg-deep-carbon p-4">
        {children}
      </div>
    </div>
  );
}

function DetailFieldValue({ value, mono }: { value: React.ReactNode; mono?: boolean }) {
  return (
    <div
      className={cn(
        'text-sm text-pure-white break-words',
        mono && 'font-mono text-xs'
      )}
    >
      {value ?? <span className="text-steel">—</span>}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="ml-2 shrink-0 rounded p-1 text-steel transition-colors hover:bg-iron/30 hover:text-pure-white"
      aria-label="Copy to clipboard"
    >
      {copied ? (
        <Check className="size-3.5 text-available-green" />
      ) : (
        <Copy className="size-3.5" />
      )}
    </button>
  );
}

function DetailGrid({ fields, columns = 2, className }: DetailGridProps) {
  const gridCols: Record<number, string> = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-3',
    4: 'sm:grid-cols-4',
  };

  return (
    <div className={cn('grid grid-cols-1 gap-4', gridCols[columns], className)}>
      {fields.map((field) => (
        <div key={field.label} className="space-y-1">
          <p className="text-xs text-steel">{field.label}</p>
          <div className="flex items-center">
            <DetailFieldValue value={field.value} mono={field.mono} />
            {field.copyable && typeof field.value === 'string' && (
              <CopyButton text={field.value} />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function DetailFieldComponent({
  label,
  value,
  copyable,
  mono,
}: DetailFieldData) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <p className="shrink-0 text-sm text-ash">{label}</p>
      <div className="flex items-center">
        <DetailFieldValue value={value} mono={mono} />
        {copyable && typeof value === 'string' && (
          <CopyButton text={value} />
        )}
      </div>
    </div>
  );
}

function DetailActions({ children, className }: DetailActionsProps) {
  return (
    <>
      <Separator className="bg-iron/30" />
      <div className={cn('flex items-center gap-2', className)}>{children}</div>
    </>
  );
}

export { DetailGroup, DetailGrid, DetailFieldComponent as DetailField, DetailActions };
export type { DetailFieldData as DetailFieldProps, DetailGroupProps, DetailGridProps, DetailActionsProps };
