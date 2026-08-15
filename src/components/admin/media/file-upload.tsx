'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { validateFileType, validateFileSize } from '@/lib/supabase/storage-helpers';
import type { BucketConfig } from '@/server/actions/mediaActions';

interface FileUploadProps {
  bucketConfig: BucketConfig;
  onUpload: (formData: FormData) => Promise<void>;
  disabled?: boolean;
}

interface PendingFile {
  file: File;
  error?: string;
}

function FileUpload({ bucketConfig, onUpload, disabled }: FileUploadProps) {
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback(
    (file: File): string | undefined => {
      const typeResult = validateFileType(file, bucketConfig.allowedTypes);
      if (!typeResult.valid) return typeResult.reason;

      const sizeResult = validateFileSize(file, bucketConfig.maxSizeMB);
      if (!sizeResult.valid) return sizeResult.reason;

      return undefined;
    },
    [bucketConfig],
  );

  const addFiles = useCallback(
    (fileList: FileList | File[]) => {
      const newFiles: PendingFile[] = [];
      for (const file of Array.from(fileList)) {
        if (file.size === 0) continue;
        const error = validateFile(file);
        newFiles.push({ file, error });
      }
      setPendingFiles((prev) => [...prev, ...newFiles]);
    },
    [validateFile],
  );

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (disabled) return;
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
    e.target.value = '';
  }

  function removePendingFile(index: number) {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleUpload() {
    const validFiles = pendingFiles.filter((f) => !f.error);
    if (validFiles.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      for (const { file } of validFiles) {
        formData.append('files', file);
      }
      await onUpload(formData);
      setPendingFiles([]);
    } finally {
      setUploading(false);
    }
  }

  const validCount = pendingFiles.filter((f) => !f.error).length;
  const errorCount = pendingFiles.filter((f) => f.error).length;

  return (
    <div className="space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={[
          'flex flex-col items-center justify-center rounded-[10px] border-2 border-dashed p-8 text-center transition-colors cursor-pointer',
          dragOver
            ? 'border-signal-red bg-signal-red/5'
            : 'border-iron/30 hover:border-iron/50 hover:bg-white/[0.02]',
          disabled && 'opacity-50 cursor-not-allowed',
        ].join(' ')}
      >
        <Upload className="mb-3 size-8 text-steel" />
        <p className="text-sm font-medium text-pure-white">
          Drop files here or click to browse
        </p>
        <p className="mt-1 text-xs text-ash">
          {bucketConfig.allowedTypes.join(', ')} — Max {bucketConfig.maxSizeMB}MB
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={bucketConfig.allowedTypes.join(',')}
          onChange={handleInputChange}
          disabled={disabled}
          className="hidden"
        />
      </div>

      {pendingFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-ash">
            <span>{pendingFiles.length} file(s) selected</span>
            <span>
              {validCount} valid{errorCount > 0 && `, ${errorCount} invalid`}
            </span>
          </div>

          <div className="max-h-40 space-y-1 overflow-y-auto">
            {pendingFiles.map((pf, i) => (
              <div
                key={`${pf.file.name}-${i}`}
                className={[
                  'flex items-center justify-between rounded-[6px] px-3 py-2 text-sm',
                  pf.error ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-pure-white',
                ].join(' ')}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {pf.error && <AlertCircle className="size-4 shrink-0" />}
                  <span className="truncate">{pf.file.name}</span>
                  <span className="shrink-0 text-xs text-steel">
                    {(pf.file.size / 1024 / 1024).toFixed(2)}MB
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removePendingFile(i);
                  }}
                  className="ml-2 shrink-0 text-steel hover:text-pure-white"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
          </div>

          {errorCount === 0 && (
            <Button
              onClick={handleUpload}
              disabled={uploading || validCount === 0}
              className="bg-signal-red text-pure-white hover:bg-deep-red"
            >
              {uploading ? 'Uploading...' : `Upload ${validCount} file(s)`}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export { FileUpload };
