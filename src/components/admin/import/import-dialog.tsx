'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/components/admin/ui/use-toast';
import type { ImportColumn, ImportResult } from '@/lib/cms/import';
import { parseCsv, parseJson, mapImportData, readImportFile } from '@/lib/cms/import';
import { generateCsvContent, generateExportFilename } from '@/lib/cms/export';
import { ImportStepUpload } from './import-step-upload';
import { ImportStepPreview } from './import-step-preview';
import { ImportStepConfirm } from './import-step-confirm';

type Step = 'upload' | 'preview' | 'confirm';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: ImportColumn<unknown>[];
  onImport: (data: unknown[]) => Promise<void>;
  templateColumns?: { header: string; key: string }[];
}

function ImportDialog({
  open,
  onOpenChange,
  columns,
  onImport,
  templateColumns,
}: ImportDialogProps) {
  const { toast } = useToast();
  const [step, setStep] = React.useState<Step>('upload');
  const [importResult, setImportResult] = React.useState<ImportResult<unknown> | null>(null);
  const [importing, setImporting] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);

  React.useEffect(() => {
    if (!open) {
      setStep('upload');
      setImportResult(null);
      setSelectedFile(null);
      setImporting(false);
    }
  }, [open]);

  async function handleFileSelect(file: File) {
    setSelectedFile(file);
    try {
      const text = await readImportFile(file);
      let parsed: string[][] | Record<string, unknown>[];

      if (file.name.endsWith('.json')) {
        parsed = parseJson(text);
      } else {
        parsed = parseCsv(text);
      }

      const result = mapImportData(parsed, columns);
      setImportResult(result);
      setStep('preview');
    } catch {
      toast({
        title: 'Import failed',
        description: 'Could not parse the selected file.',
        variant: 'error',
      });
    }
  }

  function handleDownloadTemplate() {
    if (!templateColumns) return;
    const emptyRow: Record<string, string> = {};
    const csv = generateCsvContent([emptyRow], templateColumns as never[]);
    const headerLine = templateColumns.map((c) => c.header).join(',');
    const content = headerLine + '\n';
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = generateExportFilename('import-template', 'csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function handleConfirmImport() {
    if (!importResult?.data) return;

    setImporting(true);
    try {
      await onImport(importResult.data);
      toast({
        title: 'Import complete',
        description: `Successfully imported ${importResult.validRows} row${importResult.validRows !== 1 ? 's' : ''}.`,
      });
      onOpenChange(false);
    } catch {
      toast({
        title: 'Import failed',
        description: 'An error occurred during import.',
        variant: 'error',
      });
    } finally {
      setImporting(false);
    }
  }

  const stepIndex = step === 'upload' ? 0 : step === 'preview' ? 1 : 2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-pure-white">Import Data</DialogTitle>
          <DialogDescription>
            Upload a CSV or JSON file to import data.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 py-2">
          {(['upload', 'preview', 'confirm'] as const).map((s, i) => (
            <React.Fragment key={s}>
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'flex size-7 items-center justify-center rounded-full border text-xs font-medium transition-colors',
                    i <= stepIndex
                      ? 'border-signal-red bg-signal-red text-pure-white'
                      : 'border-iron bg-carbon text-steel'
                  )}
                >
                  {i + 1}
                </div>
                <span
                  className={cn(
                    'text-sm font-medium',
                    i <= stepIndex ? 'text-pure-white' : 'text-steel'
                  )}
                >
                  {s === 'upload' ? 'Upload' : s === 'preview' ? 'Preview' : 'Confirm'}
                </span>
              </div>
              {i < 2 && (
                <div
                  className={cn(
                    'h-px flex-1',
                    i < stepIndex ? 'bg-signal-red' : 'bg-iron'
                  )}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="min-h-[280px]">
          {step === 'upload' && (
            <ImportStepUpload
              onFileSelect={handleFileSelect}
              onDownloadTemplate={handleDownloadTemplate}
              hasTemplate={!!templateColumns}
            />
          )}

          {step === 'preview' && importResult && (
            <ImportStepPreview
              result={importResult}
              onBack={() => setStep('upload')}
              onProceed={() => setStep('confirm')}
            />
          )}

          {step === 'confirm' && importResult && (
            <ImportStepConfirm
              result={importResult}
              onBack={() => setStep('preview')}
              onConfirm={handleConfirmImport}
              importing={importing}
            />
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={importing}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { ImportDialog };
export type { ImportDialogProps };
