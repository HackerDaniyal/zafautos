'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Grid3X3,
  List,
  Trash2,
  Copy,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  FileText,
  Film,
  Music,
  File,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/admin/ui/empty-state';
import { ConfirmDialog } from '@/components/admin/dialogs/confirm-dialog';
import { FileUpload } from '@/components/admin/media/file-upload';
import {
  listMedia,
  uploadMedia,
  deleteMedia,
  getBucketConfigs,
  type BucketConfig,
} from '@/server/actions/mediaActions';

interface MediaFile {
  id: string;
  name: string;
  path: string;
  bucket: string;
  size: number;
  type: string;
  url: string;
  created_at: string | null;
  updated_at: string | null;
}

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']);
const PAGE_SIZE = 24;

function isImage(type: string): boolean {
  return IMAGE_TYPES.has(type);
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function getFileIcon(type: string) {
  if (isImage(type)) return ImageIcon;
  if (type.startsWith('video/')) return Film;
  if (type.startsWith('audio/')) return Music;
  if (type.includes('pdf') || type.includes('document')) return FileText;
  return File;
}

function MediaLibraryClient() {
  const [buckets, setBuckets] = useState<BucketConfig[]>([]);
  const [activeBucket, setActiveBucket] = useState('vehicles');
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selected, setSelected] = useState<MediaFile | null>(null);
  const [lightbox, setLightbox] = useState<MediaFile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MediaFile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchBuckets = useCallback(async () => {
    const result = await getBucketConfigs();
    if (result.success && result.data) {
      setBuckets(result.data as BucketConfig[]);
    }
  }, []);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listMedia({
        bucket: activeBucket,
        search: search || undefined,
        limit: PAGE_SIZE + 1,
        offset: (page - 1) * PAGE_SIZE,
      });
      if (result.success && result.data) {
        const items = result.data as MediaFile[];
        setHasMore(items.length > PAGE_SIZE);
        setFiles(items.slice(0, PAGE_SIZE));
      }
    } catch {
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [activeBucket, search, page]);

  useEffect(() => {
    fetchBuckets();
  }, [fetchBuckets]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  function handleBucketChange(bucket: string) {
    setActiveBucket(bucket);
    setPage(1);
    setSearch('');
    setSelected(null);
  }

  async function handleUpload(formData: FormData) {
    const result = await uploadMedia({ bucket: activeBucket }, formData);
    if (result.success) {
      setFeedback({ type: 'success', message: `${(result.data as MediaFile[]).length} file(s) uploaded` });
      setShowUpload(false);
      await fetchFiles();
    } else {
      setFeedback({ type: 'error', message: result.error ?? 'Upload failed' });
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const result = await deleteMedia(deleteTarget.bucket, deleteTarget.path);
      if (result.success) {
        setFeedback({ type: 'success', message: 'File deleted' });
        setSelected(null);
        await fetchFiles();
      } else {
        setFeedback({ type: 'error', message: result.error ?? 'Delete failed' });
      }
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url);
    setFeedback({ type: 'success', message: 'URL copied to clipboard' });
  }

  const bucketConfig = buckets.find((b) => b.name === activeBucket);

  return (
    <div className="space-y-6">
      {feedback && (
        <div
          className={[
            'rounded-[6px] px-4 py-2 text-sm',
            feedback.type === 'success'
              ? 'bg-green-500/10 text-green-400'
              : 'bg-red-500/10 text-red-400',
          ].join(' ')}
        >
          {feedback.message}
        </div>
      )}

      {/* Bucket tabs */}
      <div className="flex flex-wrap gap-2">
        {buckets.map((b) => (
          <button
            key={b.name}
            onClick={() => handleBucketChange(b.name)}
            className={[
              'rounded-[6px] px-3 py-1.5 text-sm font-medium transition-colors',
              activeBucket === b.name
                ? 'bg-signal-red/10 text-signal-red'
                : 'text-ash hover:bg-white/5 hover:text-pure-white',
            ].join(' ')}
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-steel" />
          <Input
            placeholder="Search files..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Button
          onClick={() => setShowUpload(!showUpload)}
          className="bg-signal-red text-pure-white hover:bg-deep-red"
        >
          Upload Files
        </Button>
      </div>

      {/* Upload zone */}
      {showUpload && bucketConfig && (
        <div className="rounded-[10px] border border-iron/30 bg-carbon p-4">
          <FileUpload
            bucketConfig={bucketConfig}
            onUpload={handleUpload}
            disabled={loading}
          />
        </div>
      )}

      {/* File grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-[10px] bg-white/5 animate-pulse"
            />
          ))}
        </div>
      ) : files.length === 0 ? (
        <EmptyState
          title="No files"
          description={
            search
              ? `No files matching "${search}" in this bucket`
              : 'This bucket is empty. Upload some files to get started.'
          }
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {files.map((file) => (
            <button
              key={file.id}
              onClick={() => setSelected(selected?.id === file.id ? null : file)}
              onDoubleClick={() => isImage(file.type) && setLightbox(file)}
              className={[
                'group relative aspect-square rounded-[10px] border overflow-hidden transition-all text-left',
                selected?.id === file.id
                  ? 'border-signal-red ring-1 ring-signal-red'
                  : 'border-iron/20 hover:border-iron/50',
              ].join(' ')}
            >
              {isImage(file.type) ? (
                <img
                  src={file.url}
                  alt={file.name}
                  className="size-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex flex-col items-center justify-center size-full bg-white/5 p-2">
                  {(() => {
                    const Icon = getFileIcon(file.type);
                    return <Icon className="size-8 text-steel mb-2" />;
                  })()}
                  <span className="text-[10px] text-steel text-center break-all line-clamp-2">
                    {file.name}
                  </span>
                </div>
              )}

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-[10px] text-white truncate">{file.name}</p>
                <p className="text-[10px] text-white/60">{formatFileSize(file.size)}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && files.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-ash">
            Page {page}{hasMore ? '+' : ''}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasMore}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* File detail panel */}
      {selected && (
        <div className="rounded-[10px] border border-iron/30 bg-carbon p-4">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-sm font-semibold text-pure-white">File Details</h3>
            <button onClick={() => setSelected(null)} className="text-steel hover:text-pure-white">
              <X className="size-4" />
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            {/* Preview */}
            <div className="w-full md:w-48 shrink-0">
              {isImage(selected.type) ? (
                <img
                  src={selected.url}
                  alt={selected.name}
                  className="w-full rounded-[6px] object-cover cursor-pointer hover:opacity-80"
                  onClick={() => setLightbox(selected)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center aspect-square rounded-[6px] bg-white/5 p-4">
                  {(() => {
                    const Icon = getFileIcon(selected.type);
                    return <Icon className="size-12 text-steel mb-2" />;
                  })()}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 space-y-2 text-sm">
              <div>
                <span className="text-steel">Name:</span>{' '}
                <span className="text-pure-white">{selected.name}</span>
              </div>
              <div>
                <span className="text-steel">Type:</span>{' '}
                <span className="text-pure-white">{selected.type}</span>
              </div>
              <div>
                <span className="text-steel">Size:</span>{' '}
                <span className="text-pure-white">{formatFileSize(selected.size)}</span>
              </div>
              <div>
                <span className="text-steel">Bucket:</span>{' '}
                <span className="text-pure-white">{selected.bucket}</span>
              </div>
              <div>
                <span className="text-steel">Path:</span>{' '}
                <span className="text-pure-white font-mono text-xs break-all">{selected.path}</span>
              </div>
              {selected.created_at && (
                <div>
                  <span className="text-steel">Created:</span>{' '}
                  <span className="text-pure-white">
                    {new Date(selected.created_at).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyUrl(selected.url)}
                >
                  <Copy className="mr-1 size-3" />
                  Copy URL
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(selected.url, '_blank')}
                >
                  <ExternalLink className="mr-1 size-3" />
                  Open
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-400 border-red-500/30 hover:bg-red-500/10"
                  onClick={() => setDeleteTarget(selected)}
                >
                  <Trash2 className="mr-1 size-3" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white"
            onClick={() => setLightbox(null)}
          >
            <X className="size-8" />
          </button>
          <img
            src={lightbox.url}
            alt={lightbox.name}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-[6px]"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center">
            <p className="text-sm text-white">{lightbox.name}</p>
            <p className="text-xs text-white/60">{formatFileSize(lightbox.size)}</p>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete file"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}

export { MediaLibraryClient };
