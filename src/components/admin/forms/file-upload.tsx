'use client';

import * as React from 'react';
import { UploadIcon, XIcon, FileTextIcon, FilmIcon, MusicIcon, FileIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/admin/ui/use-toast';
import { STORAGE_BUCKETS, type StorageBucket } from '@/lib/supabase/storage';
import {
  validateFileType,
  validateFileSize,
  getFileExtension,
} from '@/lib/supabase/storage-helpers';
import { createClient } from '@/lib/supabase/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UploadFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  preview?: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  progress: number;
  path?: string;
  url?: string;
  error?: string;
}

interface FileUploadProps {
  accept?: string[];
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number;
  bucket?: string;
  folder?: string;
  onUpload?: (files: UploadFile[]) => void;
  onRemove?: (file: UploadFile) => void;
  files: UploadFile[];
  disabled?: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateUniquePath(
  folder: string,
  filename: string,
): string {
  const timestamp = Date.now();
  const sanitized = filename
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const ext = getFileExtension(filename);
  const base = ext ? sanitized.slice(0, -(ext.length + 1)) : sanitized;
  return `${folder}/${timestamp}-${base}${ext ? `.${ext}` : ''}`;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return null;
  if (type.startsWith('video/')) return FilmIcon;
  if (type.startsWith('audio/')) return MusicIcon;
  if (type === 'application/pdf') return FileTextIcon;
  return FileIcon;
}

function getPreviewUrl(file: File): string | undefined {
  if (file.type.startsWith('image/')) {
    return URL.createObjectURL(file);
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function FileUpload({
  accept,
  multiple = false,
  maxFiles = 10,
  maxSize = 20,
  bucket = STORAGE_BUCKETS.media,
  folder = 'uploads',
  onUpload,
  onRemove,
  files,
  disabled = false,
  className,
}: FileUploadProps) {
  const { toast } = useToast();
  const [isDragOver, setIsDragOver] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const acceptString = React.useMemo(() => {
    if (!accept || accept.length === 0) return undefined;
    return accept.join(',');
  }, [accept]);

  const addFiles = React.useCallback(
    (newFiles: FileList | File[]) => {
      const fileArray = Array.from(newFiles);
      const currentCount = files.length;
      const remaining = maxFiles - currentCount;

      if (remaining <= 0) {
        toast({
          title: 'Upload limit reached',
          description: `Maximum ${maxFiles} files allowed.`,
          variant: 'warning',
        });
        return;
      }

      const filesToAdd = fileArray.slice(0, remaining);
      if (filesToAdd.length < fileArray.length) {
        toast({
          title: 'Some files skipped',
          description: `${fileArray.length - filesToAdd.length} file(s) skipped. Maximum ${maxFiles} files allowed.`,
          variant: 'warning',
        });
      }

      const validFiles: UploadFile[] = [];

      for (const file of filesToAdd) {
        if (accept && accept.length > 0) {
          const typeResult = validateFileType(file, accept);
          if (!typeResult.valid) {
            toast({
              title: 'Invalid file type',
              description: typeResult.reason,
              variant: 'error',
            });
            continue;
          }
        }

        const sizeResult = validateFileSize(file, maxSize);
        if (!sizeResult.valid) {
          toast({
            title: 'File too large',
            description: sizeResult.reason,
            variant: 'error',
          });
          continue;
        }

        validFiles.push({
          id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          preview: getPreviewUrl(file),
          status: 'pending',
          progress: 0,
        });
      }

      if (validFiles.length > 0) {
        onUpload?.(validFiles);
      }
    },
    [files.length, maxFiles, accept, maxSize, onUpload, toast],
  );

  const handleDragOver = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) setIsDragOver(true);
    },
    [disabled],
  );

  const handleDragLeave = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      if (!disabled && e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [disabled, addFiles],
  );

  const handleClick = React.useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  const handleInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files);
        e.target.value = '';
      }
    },
    [addFiles],
  );

  const uploadFiles = React.useCallback(
    async (filesToUpload: UploadFile[]) => {
      const results: UploadFile[] = [];

      for (const uploadFile of filesToUpload) {
        const path = generateUniquePath(folder, uploadFile.name);

        try {
          const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, uploadFile.file, {
              cacheControl: '3600',
              upsert: false,
            });

          if (error) throw error;

          const {
            data: { publicUrl },
          } = supabase.storage.from(bucket).getPublicUrl(data.path);

          const completed: UploadFile = {
            ...uploadFile,
            status: 'done',
            progress: 100,
            path: data.path,
            url: publicUrl,
          };
          results.push(completed);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Upload failed';
          results.push({
            ...uploadFile,
            status: 'error',
            error: errorMessage,
          });
          toast({
            title: 'Upload failed',
            description: `Failed to upload "${uploadFile.name}": ${errorMessage}`,
            variant: 'error',
          });
        }
      }

      return results;
    },
    [bucket, folder, supabase, toast],
  );

  return (
    <div className={cn('grid gap-3', className)}>
      <input
        ref={inputRef}
        type="file"
        accept={acceptString}
        multiple={multiple}
        onChange={handleInputChange}
        className="hidden"
      />

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-[8px] border-2 border-dashed p-8 text-center transition-colors',
          isDragOver
            ? 'border-signal-red bg-signal-red/5'
            : 'border-iron bg-deep-carbon hover:border-steel',
          disabled && 'pointer-events-none opacity-50',
        )}
      >
        <UploadIcon
          className={cn(
            'size-8',
            isDragOver ? 'text-signal-red' : 'text-steel',
          )}
        />
        <div className="text-sm text-ash">
          <span className="font-medium text-pure-white hover:text-signal-red cursor-pointer">
            Click to upload
          </span>{' '}
          or drag and drop
        </div>
        {accept && accept.length > 0 && (
          <p className="text-xs text-steel">
            {accept.map((t) => t.split('/')[1]?.toUpperCase() || t).join(', ')}
            {maxSize && ` · Max ${maxSize} MB`}
          </p>
        )}
      </div>

      {files.length > 0 && (
        <div className="grid gap-2">
          {files.map((file) => (
            <FilePreview
              key={file.id}
              file={file}
              onRemove={() => onRemove?.(file)}
              disabled={disabled}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// File preview sub-component
// ---------------------------------------------------------------------------

interface FilePreviewProps {
  file: UploadFile;
  onRemove: () => void;
  disabled: boolean;
}

function FilePreview({ file, onRemove, disabled }: FilePreviewProps) {
  const IconComponent = getFileIcon(file.type);

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-[6px] border border-iron bg-deep-carbon p-2.5',
        file.status === 'error' && 'border-red-500/50',
        file.status === 'done' && 'border-available-green/50',
      )}
    >
      {file.preview ? (
        <img
          src={file.preview}
          alt={file.name}
          className="size-10 shrink-0 rounded-[4px] object-cover"
        />
      ) : IconComponent ? (
        <div className="flex size-10 shrink-0 items-center justify-center rounded-[4px] bg-iron/30">
          <IconComponent className="size-5 text-steel" />
        </div>
      ) : (
        <div className="flex size-10 shrink-0 items-center justify-center rounded-[4px] bg-iron/30">
          <FileIcon className="size-5 text-steel" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-pure-white">{file.name}</p>
        <p className="text-xs text-steel">{formatFileSize(file.size)}</p>
        {file.status === 'uploading' && (
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-iron">
            <div
              className="h-full bg-signal-red transition-all"
              style={{ width: `${file.progress}%` }}
            />
          </div>
        )}
        {file.status === 'error' && file.error && (
          <p className="mt-0.5 text-xs text-red-400">{file.error}</p>
        )}
        {file.status === 'done' && (
          <p className="mt-0.5 text-xs text-available-green">Uploaded</p>
        )}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        disabled={disabled || file.status === 'uploading'}
        className="shrink-0 text-steel hover:text-pure-white"
      >
        <XIcon className="size-3.5" />
      </Button>
    </div>
  );
}

export { FileUpload, type FileUploadProps };
