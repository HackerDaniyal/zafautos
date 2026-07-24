'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { ImportResult, ImportError } from '@/lib/cms/import';

interface ImportStepPreviewProps {
  result: ImportResult<unknown>;
  onBack: () => void;
  onProceed: () => void;
}

function ImportStepPreview({ result, onBack, onProceed }: ImportStepPreviewProps) {
  const previewData = result.data?.slice(0, 10) ?? [];
  const columns = result.data && result.data.length > 0
    ? Object.keys(result.data[0] as Record<string, unknown>)
    : [];
  const hasErrors = result.errors.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-4 text-green-500" />
          <span className="text-sm text-pure-white">
            <span className="font-medium">{result.validRows}</span> valid
          </span>
        </div>
        {hasErrors && (
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-signal-red" />
            <span className="text-sm text-pure-white">
              <span className="font-medium">{result.skippedRows}</span> errors
            </span>
          </div>
        )}
        <Badge variant="secondary" className="ml-auto">
          {result.totalRows} total rows
        </Badge>
      </div>

      {hasErrors && (
        <div className="max-h-32 overflow-y-auto rounded-[6px] border border-signal-red/20 bg-signal-red/5 p-3">
          <p className="mb-2 text-xs font-medium text-signal-red">Errors</p>
          <div className="space-y-1">
            {result.errors.slice(0, 20).map((error, i) => (
              <p key={i} className="text-xs text-ash">
                Row {error.row}: {error.message}
              </p>
            ))}
            {result.errors.length > 20 && (
              <p className="text-xs text-steel">
                ...and {result.errors.length - 20} more errors
              </p>
            )}
          </div>
        </div>
      )}

      {previewData.length > 0 && (
        <div className="rounded-[10px] border border-iron/30 bg-carbon overflow-hidden">
          <div className="px-4 py-2 border-b border-iron/30">
            <p className="text-xs text-steel">Preview (first {Math.min(result.totalRows, 10)} rows)</p>
          </div>
          <div className="overflow-x-auto max-h-[240px]">
            <Table>
              <TableHeader>
                <TableRow className="border-iron/30 hover:bg-transparent">
                  {columns.map((col) => (
                    <TableHead key={col} className="text-pure-white whitespace-nowrap">
                      {col}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewData.map((row, i) => {
                  const record = row as Record<string, unknown>;
                  return (
                    <TableRow key={i} className="border-iron/30">
                      {columns.map((col) => (
                        <TableCell key={col} className="whitespace-nowrap text-ash">
                          {String(record[col] ?? '')}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-1.5 size-3.5" />
          Back
        </Button>
        <Button
          onClick={onProceed}
          disabled={result.validRows === 0}
        >
          Continue
          <ArrowRight className="ml-1.5 size-3.5" />
        </Button>
      </div>
    </div>
  );
}

export { ImportStepPreview };
