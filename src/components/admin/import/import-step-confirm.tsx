'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, CheckCircle2, AlertTriangle, SkipForward } from 'lucide-react';
import type { ImportResult } from '@/lib/cms/import';

interface ImportStepConfirmProps {
  result: ImportResult<unknown>;
  onBack: () => void;
  onConfirm: () => Promise<void>;
  importing: boolean;
}

function ImportStepConfirm({ result, onBack, onConfirm, importing }: ImportStepConfirmProps) {
  return (
    <div className="flex flex-col items-center gap-6 py-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="rounded-full bg-iron/30 p-4">
          <CheckCircle2 className="size-8 text-signal-red" />
        </div>
        <h3 className="text-lg font-semibold text-pure-white">Ready to Import</h3>
        <p className="text-sm text-ash">
          Review the summary below and confirm to proceed.
        </p>
      </div>

      <div className="w-full max-w-sm space-y-3">
        <div className="flex items-center justify-between rounded-[6px] border border-iron/30 bg-deep-carbon px-4 py-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-green-500" />
            <span className="text-sm text-pure-white">Valid rows</span>
          </div>
          <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">
            {result.validRows}
          </Badge>
        </div>

        {result.skippedRows > 0 && (
          <div className="flex items-center justify-between rounded-[6px] border border-iron/30 bg-deep-carbon px-4 py-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-signal-red" />
              <span className="text-sm text-pure-white">Skipped rows</span>
            </div>
            <Badge variant="secondary" className="bg-signal-red/10 text-signal-red border-signal-red/20">
              {result.skippedRows}
            </Badge>
          </div>
        )}

        <div className="flex items-center justify-between rounded-[6px] border border-iron/30 bg-deep-carbon px-4 py-3">
          <div className="flex items-center gap-2">
            <SkipForward className="size-4 text-steel" />
            <span className="text-sm text-pure-white">Total rows</span>
          </div>
          <Badge variant="secondary">
            {result.totalRows}
          </Badge>
        </div>
      </div>

      <div className="flex w-full justify-between">
        <Button variant="outline" onClick={onBack} disabled={importing}>
          <ArrowLeft className="mr-1.5 size-3.5" />
          Back
        </Button>
        <Button
          onClick={onConfirm}
          disabled={importing || result.validRows === 0}
        >
          {importing ? (
            <>
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              Import {result.validRows} row{result.validRows !== 1 ? 's' : ''}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export { ImportStepConfirm };
