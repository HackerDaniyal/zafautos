'use client';

import * as React from 'react';
import {
  SearchIcon,
  Trash2Icon,
  CopyIcon,
  CheckIcon,
  FileTextIcon,
  FilmIcon,
  MusicIcon,
  FileIcon,
  UploadIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ImageIcon,
  XIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/components/admin/ui/use-toast';
import { EmptyState } from '@/components/admin/ui/empty-state';
import { STORAGE_BUCKETS, type StorageBucket } from '@/lib/supabase/storage';
import { FileUpload, type UploadFile } from '@/components/admin/forms/file-upload';
import { listMedia, deleteMedia, getMediaUrl } from '@/server/actions/mediaActions';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MediaItem {
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

type FilterType = 'all' | 'images' | 'documents' | 'videos';

interface MediaLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect?: (item: MediaItem) => void;
  multiple?: boolean;
  accept?: FilterType;
  bucket?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getMediaIcon(type: string) {
  if (type.startsWith('image/')) return ImageIcon;
  if (type.startsWith('video/')) return FilmIcon;
  if (type.startsWith('audio/')) return MusicIcon;
  if (type === 'application/pdf') return FileTextIcon;
  return FileIcon;
}

function getFileCategory(type: string): FilterType {
  if (type.startsWith('image/')) return 'images';
  if (type.startsWith('video/')) return 'videos';
  return 'documents';
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function MediaLibrary({
  open,
  onOpenChange,
  onSelect,
  multiple = false,
  accept = 'all',
  bucket = STORAGE_BUCKETS.media,
}: MediaLibraryProps) {
  const { toast } = useToast();
  const [items, setItems] = React.useState<MediaItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [filter, setFilter] = React.useState<FilterType>(accept);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [previewItem, setPreviewItem] = React.useState<MediaItem | null>(null);
  const [page, setPage] = React.useState(0);
  const [hasMore, setHasMore] = React.useState(true);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [showUpload, setShowUpload] = React.useState(false);

  const PAGE_SIZE = 24;

  const fetchFiles = React.useCallback(
    async (reset = false) => {
      setLoading(true);
      try {
        const offset = reset ? 0 : page * PAGE_SIZE;
        const result = await listMedia({
          bucket,
          prefix: filter !== 'all' ? filter : undefined,
          limit: PAGE_SIZE,
          offset,
        });

        if (result.success) {
          const newItems = result.data as MediaItem[];
          setItems((prev) => (reset ? newItems : [...prev, ...newItems]));
          setHasMore(newItems.length === PAGE_SIZE);
        } else {
          toast({
            title: 'Error loading media',
            description: result.error,
            variant: 'error',
          });
        }
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to load media files',
          variant: 'error',
        });
      } finally {
        setLoading(false);
      }
    },
    [bucket, filter, page, toast],
  );

  React.useEffect(() => {
    if (open) {
      setPage(0);
      setSelected(new Set());
      setPreviewItem(null);
      setSearch('');
      setFilter(accept);
    }
  }, [open, accept]);

  React.useEffect(() => {
    if (open) {
      fetchFiles(true);
    }
  }, [open, filter, fetchFiles]);

  const filteredItems = React.useMemo(() => {
    if (!search) return items;
    return items.filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [items, search]);

  const toggleSelect = React.useCallback(
    (item: MediaItem) => {
      if (multiple) {
        setSelected((prev) => {
          const next = new Set(prev);
          if (next.has(item.path)) {
            next.delete(item.path);
          } else {
            next.add(item.path);
          }
          return next;
        });
      } else {
        onSelect?.(item);
        onOpenChange(false);
      }
    },
    [multiple, onSelect, onOpenChange],
  );

  const handleDelete = React.useCallback(
    async (item: MediaItem) => {
      try {
        const result = await deleteMedia(item.bucket, item.path);
        if (result.success) {
          setItems((prev) => prev.filter((i) => i.path !== item.path));
          setSelected((prev) => {
            const next = new Set(prev);
            next.delete(item.path);
            return next;
          });
          if (previewItem?.path === item.path) {
            setPreviewItem(null);
          }
          toast({
            title: 'Deleted',
            description: `"${item.name}" has been deleted.`,
          });
        } else {
          toast({
            title: 'Delete failed',
            description: result.error,
            variant: 'error',
          });
        }
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to delete file',
          variant: 'error',
        });
      }
    },
    [previewItem, toast],
  );

  const handleCopyUrl = React.useCallback(
    async (item: MediaItem) => {
      try {
        const result = await getMediaUrl(item.bucket, item.path);
        if (result.success) {
          await navigator.clipboard.writeText(result.data as string);
          setCopiedId(item.path);
          setTimeout(() => setCopiedId(null), 2000);
          toast({
            title: 'URL copied',
            description: 'File URL copied to clipboard',
          });
        } else {
          toast({
            title: 'Copy failed',
            description: result.error,
            variant: 'error',
          });
        }
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to copy URL',
          variant: 'error',
        });
      }
    },
    [toast],
  );

  const handleConfirmSelection = React.useCallback(() => {
    if (!multiple) return;
    const selectedItems = items.filter((i) => selected.has(i.path));
    selectedItems.forEach((item) => onSelect?.(item));
    onOpenChange(false);
  }, [multiple, items, selected, onSelect, onOpenChange]);

  const handleUploadComplete = React.useCallback(
    (uploadedFiles: UploadFile[]) => {
      const newItems: MediaItem[] = uploadedFiles
        .filter((f) => f.status === 'done' && f.url)
        .map((f) => ({
          id: f.id,
          name: f.name,
          path: f.path ?? '',
          bucket,
          size: f.size,
          type: f.type,
          url: f.url ?? '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));
      setItems((prev) => [...newItems, ...prev]);
      setShowUpload(false);
    },
    [bucket],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Media Library</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 flex-1 min-h-0">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-steel" />
              <Input
                placeholder="Search files..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUpload(!showUpload)}
            >
              <UploadIcon className="size-4" />
              Upload
            </Button>
          </div>

          <div className="flex items-center gap-1.5">
            {(['all', 'images', 'documents', 'videos'] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'ghost'}
                size="xs"
                onClick={() => {
                  setFilter(f);
                  setPage(0);
                }}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
            {multiple && selected.size > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {selected.size} selected
              </Badge>
            )}
          </div>

          {showUpload && (
            <div className="rounded-[6px] border border-iron bg-deep-carbon p-4">
              <FileUpload
                accept={accept === 'all' ? undefined : undefined}
                multiple
                bucket={bucket}
                folder="media"
                files={[]}
                onUpload={handleUploadComplete}
                onRemove={() => {}}
              />
            </div>
          )}

          <div className="flex-1 min-h-0 overflow-y-auto">
            {loading && items.length === 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square animate-pulse rounded-[6px] bg-iron/20"
                  />
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              <EmptyState
                title="No files found"
                description={search ? 'Try a different search term' : 'Upload files to get started'}
                icon={FileIcon}
              />
            ) : (
              <>
                <div className="grid grid-cols-4 gap-2">
                  {filteredItems.map((item) => (
                    <MediaCard
                      key={item.path}
                      item={item}
                      isSelected={selected.has(item.path)}
                      onSelect={toggleSelect}
                      onPreview={setPreviewItem}
                      onDelete={handleDelete}
                      onCopyUrl={handleCopyUrl}
                      copiedId={copiedId}
                    />
                  ))}
                </div>

                {hasMore && (
                  <div className="flex justify-center pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPage((p) => p + 1);
                        fetchFiles(false);
                      }}
                      disabled={loading}
                    >
                      {loading ? 'Loading...' : 'Load more'}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {multiple && selected.size > 0 && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmSelection}>
              Select ({selected.size})
            </Button>
          </DialogFooter>
        )}
      </DialogContent>

      {previewItem && (
        <MediaPreviewDialog
          item={previewItem}
          open={!!previewItem}
          onOpenChange={(open) => !open && setPreviewItem(null)}
          onDelete={handleDelete}
          onCopyUrl={handleCopyUrl}
        />
      )}
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Media card sub-component
// ---------------------------------------------------------------------------

interface MediaCardProps {
  item: MediaItem;
  isSelected: boolean;
  onSelect: (item: MediaItem) => void;
  onPreview: (item: MediaItem) => void;
  onDelete: (item: MediaItem) => void;
  onCopyUrl: (item: MediaItem) => void;
  copiedId: string | null;
}

function MediaCard({
  item,
  isSelected,
  onSelect,
  onPreview,
  onDelete,
  onCopyUrl,
  copiedId,
}: MediaCardProps) {
  const IconComponent = getMediaIcon(item.type);
  const isImage = item.type.startsWith('image/');

  return (
    <div
      className={cn(
        'group relative aspect-square cursor-pointer overflow-hidden rounded-[6px] border transition-colors',
        isSelected
          ? 'border-signal-red bg-signal-red/5'
          : 'border-iron bg-deep-carbon hover:border-steel',
      )}
      onClick={() => onSelect(item)}
      onDoubleClick={() => onPreview(item)}
    >
      {isImage && item.url ? (
        <img
          src={item.url}
          alt={item.name}
          className="size-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex size-full items-center justify-center">
          <IconComponent className="size-8 text-steel" />
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 transition-opacity group-hover:opacity-100">
        <p className="truncate text-xs font-medium text-pure-white">{item.name}</p>
        <p className="text-[10px] text-ash">{formatFileSize(item.size)}</p>
      </div>

      <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCopyUrl(item);
          }}
          className="rounded-[4px] bg-black/60 p-1 text-pure-white hover:bg-black/80"
        >
          {copiedId === item.path ? (
            <CheckIcon className="size-3 text-available-green" />
          ) : (
            <CopyIcon className="size-3" />
          )}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item);
          }}
          className="rounded-[4px] bg-black/60 p-1 text-pure-white hover:bg-red-600/80"
        >
          <Trash2Icon className="size-3" />
        </button>
      </div>

      {isSelected && (
        <div className="absolute top-1.5 left-1.5">
          <div className="flex size-5 items-center justify-center rounded-full bg-signal-red">
            <CheckIcon className="size-3 text-pure-white" />
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Media preview dialog
// ---------------------------------------------------------------------------

interface MediaPreviewDialogProps {
  item: MediaItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (item: MediaItem) => void;
  onCopyUrl: (item: MediaItem) => void;
}

function MediaPreviewDialog({
  item,
  open,
  onOpenChange,
  onDelete,
  onCopyUrl,
}: MediaPreviewDialogProps) {
  const isImage = item.type.startsWith('image/');
  const isVideo = item.type.startsWith('video/');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="pr-8">{item.name}</DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-center rounded-[6px] bg-deep-carbon p-2">
          {isImage && item.url ? (
            <img
              src={item.url}
              alt={item.name}
              className="max-h-[50vh] rounded-[4px] object-contain"
            />
          ) : isVideo && item.url ? (
            <video
              src={item.url}
              controls
              className="max-h-[50vh] rounded-[4px]"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 py-12">
              <FileIcon className="size-12 text-steel" />
              <p className="text-sm text-ash">Preview not available</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-steel">Size: </span>
            <span className="text-pure-white">{formatFileSize(item.size)}</span>
          </div>
          <div>
            <span className="text-steel">Type: </span>
            <span className="text-pure-white">{item.type}</span>
          </div>
          {item.created_at && (
            <div className="col-span-2">
              <span className="text-steel">Uploaded: </span>
              <span className="text-pure-white">
                {new Date(item.created_at).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onCopyUrl(item)}>
            <CopyIcon className="size-4" />
            Copy URL
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onDelete(item);
              onOpenChange(false);
            }}
          >
            <Trash2Icon className="size-4" />
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { MediaLibrary, type MediaLibraryProps, type MediaItem, type FilterType };
