'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Download } from 'lucide-react';

interface ImportStepUploadProps {
  onFileSelect: (file: File) => void;
  onDownloadTemplate: () => void;
  hasTemplate: boolean;
}

function ImportStepUpload({ onFileSelect, onDownloadTemplate, hasTemplate }: ImportStepUploadProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && isAcceptedFile(file)) {
      onFileSelect(file);
    }
  }

  function handleClick() {
    inputRef.current?.click();
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  }

  function isAcceptedFile(file: File): boolean {
    return (
      file.name.endsWith('.csv') ||
      file.name.endsWith('.json') ||
      file.type === 'text/csv' ||
      file.type === 'application/json'
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={cn(
          'flex w-full cursor-pointer flex-col items-center gap-3 rounded-[10px] border-2 border-dashed p-10 transition-colors',
          isDragging
            ? 'border-signal-red bg-signal-red/5'
            : 'border-iron/50 bg-deep-carbon hover:border-iron hover:bg-iron/10'
        )}
      >
        <div className="rounded-full bg-iron/30 p-4">
          <Upload className="size-6 text-steel" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-pure-white">
            Drag & drop your file here
          </p>
          <p className="mt-1 text-xs text-ash">
            or click to browse
          </p>
        </div>
        <p className="text-xs text-steel">
          Supports CSV and JSON files
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,.json,text/csv,application/json"
        onChange={handleChange}
        className="hidden"
      />

      {hasTemplate && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDownloadTemplate}
          className="text-ash hover:text-pure-white"
        >
          <Download className="mr-1.5 size-3.5" />
          Download template
        </Button>
      )}
    </div>
  );
}

export { ImportStepUpload };
