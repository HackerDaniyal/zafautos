'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  AlertTriangle,
  Edit,
  Trash2,
  Copy,
  Star,
  StarOff,
  ExternalLink,
  Upload,
  ImageIcon,
  Search,
  Eye,
  Globe,
  MoreVertical,
  Check,
  X,
  FileText,
  Truck,
  DollarSign,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/admin/ui/page-header';
import { StatusChip, getStatusVariant } from '@/components/admin/ui/status-chip';
import { DetailGroup, DetailGrid, DetailField } from '@/components/admin/drawer/detail-sections';
import { EmptyState } from '@/components/admin/ui/empty-state';
import { ActivityTimeline } from '@/components/admin/timeline/activity-timeline';
import type { TimelineActivity } from '@/components/admin/timeline/timeline-entry';
import { Skeleton } from '@/components/admin/ui/skeletons';
import { useToast } from '@/components/admin/ui/use-toast';
import { cn, formatPrice, formatMileage } from '@/lib/utils';
import {
  getVehicleDetail,
  publishVehicle,
  archiveVehicle,
  toggleVehicleFeatured,
  softDeleteVehicle,
  deleteVehicleImage,
  setVehiclePrimaryImage,
  uploadVehicleImages,
  getVehicleFeaturesAction,
  addVehicleFeatureAction,
  deleteVehicleFeatureAction,
  getVehicleSpecificationsAction,
  addVehicleSpecificationAction,
  deleteVehicleSpecificationAction,
  getVehicleDocumentsAction,
  addVehicleDocumentAction,
  deleteVehicleDocumentAction,
  uploadVehicleDocumentFileAction,
  getVehicleStatusHistoryAction,
} from '@/server/actions/vehicleActions';
import { VehicleDeleteDialog } from '../components/vehicle-delete-dialog';
import { VehicleStatusDialog } from '../components/vehicle-status-dialog';
import type { VehicleWithImages, VehicleStatus } from '../types';

type VehicleDetail = VehicleWithImages & { relations?: Record<string, string | null> };
import { VEHICLE_STATUS_CONFIG } from '../constants';
import { Input } from '@/components/ui/input';

type Tab = 'overview' | 'specifications' | 'gallery' | 'pricing' | 'documents' | 'features' | 'shipping' | 'activity' | 'seo';

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'Overview', icon: Eye },
  { id: 'specifications', label: 'Specs', icon: Settings },
  { id: 'gallery', label: 'Gallery', icon: ImageIcon },
  { id: 'pricing', label: 'Pricing', icon: DollarSign },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'features', label: 'Features', icon: Star },
  { id: 'shipping', label: 'Shipping', icon: Truck },
  { id: 'activity', label: 'Activity', icon: Search },
  { id: 'seo', label: 'SEO', icon: Globe },
];

function VehicleSpecsSection({ vehicleId }: { vehicleId: string }) {
  const { toast } = useToast();
  const [specs, setSpecs] = useState<Array<{ id: string; name: string; value: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newValue, setNewValue] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchSpecs = useCallback(async () => {
    const result = await getVehicleSpecificationsAction(vehicleId);
    if (result.success) setSpecs(result.data as Array<{ id: string; name: string; value: string | null }>);
    setLoading(false);
  }, [vehicleId]);

  useEffect(() => { fetchSpecs(); }, [fetchSpecs]);

  async function handleAdd() {
    if (!newName.trim()) return;
    setAdding(true);
    const result = await addVehicleSpecificationAction(vehicleId, newName.trim(), newValue.trim());
    if (result.success) { setNewName(''); setNewValue(''); await fetchSpecs(); }
    else toast({ title: 'Error', description: result.error, variant: 'error' });
    setAdding(false);
  }

  async function handleDelete(specId: string) {
    const result = await deleteVehicleSpecificationAction(specId);
    if (result.success) await fetchSpecs();
  }

  return (
    <DetailGroup title="Custom Specifications">
      {loading ? (
        <p className="text-sm text-steel">Loading...</p>
      ) : (
        <div className="space-y-3">
          {specs.map((spec) => (
            <div key={spec.id} className="flex items-center justify-between rounded-[6px] border border-iron/30 bg-deep-carbon p-3">
              <div>
                <p className="text-sm font-medium text-pure-white">{spec.name}</p>
                <p className="text-xs text-steel">{spec.value || '—'}</p>
              </div>
              <Button variant="ghost" size="icon-xs" onClick={() => handleDelete(spec.id)}>
                <Trash2 className="size-3.5 text-signal-red" />
              </Button>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name" className="flex-1 bg-deep-carbon border-iron/30 text-pure-white" />
            <Input value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="Value" className="flex-1 bg-deep-carbon border-iron/30 text-pure-white" />
            <Button size="sm" onClick={handleAdd} disabled={adding || !newName.trim()}>
              <Settings className="mr-1 size-3.5" /> Add
            </Button>
          </div>
        </div>
      )}
    </DetailGroup>
  );
}

function VehicleDocumentsSection({ vehicleId }: { vehicleId: string }) {
  const { toast } = useToast();
  const [docs, setDocs] = useState<Array<{ id: string; documentUrl: string; createdAt: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState('');
  const [adding, setAdding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocs = useCallback(async () => {
    const result = await getVehicleDocumentsAction(vehicleId);
    if (result.success) setDocs(result.data as Array<{ id: string; documentUrl: string; createdAt: string }>);
    setLoading(false);
  }, [vehicleId]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  async function handleAdd() {
    if (!url.trim()) return;
    setAdding(true);
    const result = await addVehicleDocumentAction(vehicleId, url.trim());
    if (result.success) { setUrl(''); await fetchDocs(); }
    else toast({ title: 'Error', description: result.error, variant: 'error' });
    setAdding(false);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadProgress(`Uploading ${file.name}...`);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await uploadVehicleDocumentFileAction(vehicleId, formData);
      if (result.success) {
        await fetchDocs();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'error' });
      }
    } catch (err) {
      toast({ title: 'Upload failed', description: String(err), variant: 'error' });
    } finally {
      setUploading(false);
      setUploadProgress('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleDelete(docId: string) {
    const result = await deleteVehicleDocumentAction(docId);
    if (result.success) await fetchDocs();
  }

  function getDocFileName(docUrl: string) {
    try { return docUrl.split('/').pop()?.split('?')[0] ?? docUrl; } catch { return docUrl; }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[10px] border border-iron/30 bg-carbon p-6">
        <h3 className="mb-4 text-sm font-medium text-pure-white">Vehicle Documents</h3>
        {loading ? (
          <p className="text-sm text-steel">Loading...</p>
        ) : docs.length === 0 ? (
          <EmptyState title="No documents" description="Upload files or add document URLs for this vehicle." />
        ) : (
          <div className="space-y-2">
            {docs.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between rounded-[6px] border border-iron/30 bg-deep-carbon p-3">
                <div className="flex items-center gap-2 truncate max-w-[80%]">
                  <FileText className="size-4 shrink-0 text-steel" />
                  <a href={doc.documentUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-signal-red hover:underline truncate">
                    {getDocFileName(doc.documentUrl)}
                  </a>
                </div>
                <Button variant="ghost" size="icon-xs" onClick={() => handleDelete(doc.id)}>
                  <Trash2 className="size-3.5 text-signal-red" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2">
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Or paste document URL" className="flex-1 bg-deep-carbon border-iron/30 text-pure-white" />
            <Button size="sm" onClick={handleAdd} disabled={adding || !url.trim()}>
              <Upload className="mr-1 size-3.5" /> Add URL
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png" className="hidden" onChange={handleFileUpload} />
            <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              <Upload className="mr-1 size-3.5" /> {uploading ? uploadProgress : 'Upload File'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function VehicleFeaturesSection({ vehicleId }: { vehicleId: string }) {
  const { toast } = useToast();
  const [features, setFeatures] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [newFeature, setNewFeature] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchFeatures = useCallback(async () => {
    const result = await getVehicleFeaturesAction(vehicleId);
    if (result.success) setFeatures(result.data as Array<{ id: string; name: string }>);
    setLoading(false);
  }, [vehicleId]);

  useEffect(() => { fetchFeatures(); }, [fetchFeatures]);

  async function handleAdd() {
    if (!newFeature.trim()) return;
    setAdding(true);
    const result = await addVehicleFeatureAction(vehicleId, newFeature.trim());
    if (result.success) { setNewFeature(''); await fetchFeatures(); }
    else toast({ title: 'Error', description: result.error, variant: 'error' });
    setAdding(false);
  }

  async function handleDelete(featureId: string) {
    const result = await deleteVehicleFeatureAction(featureId);
    if (result.success) await fetchFeatures();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[10px] border border-iron/30 bg-carbon p-6">
        <h3 className="mb-4 text-sm font-medium text-pure-white">Features & Accessories</h3>
        {loading ? (
          <p className="text-sm text-steel">Loading...</p>
        ) : features.length === 0 ? (
          <EmptyState title="No features" description="Add features for this vehicle." />
        ) : (
          <div className="flex flex-wrap gap-2">
            {features.map((f) => (
              <div key={f.id} className="flex items-center gap-1 rounded-full border border-iron/30 bg-deep-carbon px-3 py-1.5">
                <span className="text-sm text-pure-white">{f.name}</span>
                <button onClick={() => handleDelete(f.id)} className="ml-1 text-steel hover:text-signal-red">×</button>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 flex items-center gap-2">
          <Input value={newFeature} onChange={(e) => setNewFeature(e.target.value)} placeholder="Feature name" className="flex-1 bg-deep-carbon border-iron/30 text-pure-white"
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
          />
          <Button size="sm" onClick={handleAdd} disabled={adding || !newFeature.trim()}>
            <Star className="mr-1 size-3.5" /> Add
          </Button>
        </div>
      </div>
    </div>
  );
}

function VehicleStatusHistory({ vehicleId }: { vehicleId: string }) {
  const [history, setHistory] = useState<Array<{ id: string; status: string; note: string | null; createdAt: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getVehicleStatusHistoryAction(vehicleId).then((result: { success: boolean; data?: unknown }) => {
      if (result.success) setHistory(result.data as Array<{ id: string; status: string; note: string | null; createdAt: string }>);
      setLoading(false);
    });
  }, [vehicleId]);

  if (loading) return <p className="text-sm text-steel">Loading...</p>;
  if (history.length === 0) return <p className="text-sm text-steel">No status changes recorded.</p>;

  return (
    <div className="space-y-3">
      {history.map((entry) => (
        <div key={entry.id} className="flex items-start gap-3 rounded-[6px] border border-iron/30 bg-deep-carbon p-3">
          <div className="mt-0.5 size-2 rounded-full bg-signal-red" />
          <div>
            <p className="text-sm text-pure-white">Status changed to <span className="font-medium">{entry.status}</span></p>
            {entry.note && <p className="mt-1 text-xs text-steel">{entry.note}</p>}
            <p className="mt-1 text-xs text-steel">{new Date(entry.createdAt).toLocaleString()}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

interface VehicleDetailClientProps {
  vehicleId: string;
}

export function VehicleDetailClient({ vehicleId }: VehicleDetailClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [vehicle, setVehicle] = useState<VehicleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [actionLoading, setActionLoading] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchVehicle = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getVehicleDetail(vehicleId);
      if (result.success && result.data) {
        setVehicle(result.data as VehicleDetail);
      } else if (!result.success) {
        setError(result.error || 'Vehicle not found');
      }
    } catch {
      setError('Failed to load vehicle');
    } finally {
      setLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    fetchVehicle();
  }, [fetchVehicle]);

  async function handleAction(action: () => Promise<unknown>, label: string) {
    setActionLoading(true);
    try {
      await action;
      toast({ title: label, variant: 'success' });
      await fetchVehicle();
    } catch {
      toast({ title: 'Error', description: `Failed to ${label.toLowerCase()}`, variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  function handleCopy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied', description: `${label} copied to clipboard`, variant: 'default' });
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      for (const file of Array.from(files)) {
        formData.append('images', file);
      }
      const result = await uploadVehicleImages(vehicleId, formData);
      if (result.success) {
        toast({ title: 'Images uploaded', variant: 'success' });
        await fetchVehicle();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'error' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to upload images', variant: 'error' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleDeleteImage(imageId: string) {
    try {
      const result = await deleteVehicleImage(imageId);
      if (result.success) {
        toast({ title: 'Image deleted', variant: 'success' });
        await fetchVehicle();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'error' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete image', variant: 'error' });
    }
  }

  async function handleSetPrimary(imageId: string) {
    try {
      const result = await setVehiclePrimaryImage(vehicleId, imageId);
      if (result.success) {
        toast({ title: 'Primary image updated', variant: 'success' });
        await fetchVehicle();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'error' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to set primary image', variant: 'error' });
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-[10px]" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-[10px]" />
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
        <p className="text-lg font-medium text-pure-white">Vehicle not found</p>
        <p className="mt-2 text-sm text-ash">{error || 'The requested vehicle does not exist.'}</p>
        <Button asChild className="mt-4">
          <Link href="/admin/vehicles">
            <ArrowLeft className="mr-2 size-4" />
            Back to Vehicles
          </Link>
        </Button>
      </div>
    );
  }

  const rel = (key: string): string | null => vehicle.relations?.[key] ?? null;

  const vehicleName = [vehicle.year, rel('manufacturerName'), rel('modelName')]
    .filter(Boolean)
    .join(' ') || 'Untitled Vehicle';

  const statusConfig = VEHICLE_STATUS_CONFIG[vehicle.status as VehicleStatus];
  const primaryImage = vehicle.images.find((img) => img.isPrimary) || vehicle.images[0];
  const sortedImages = [...vehicle.images].sort((a, b) => a.sortOrder - b.sortOrder);

  const basicFields = [
    { label: 'VIN', value: vehicle.vin, copyable: true, mono: true },
    { label: 'Stock Number', value: vehicle.stockNumber, copyable: true, mono: true },
    { label: 'Year', value: vehicle.year?.toString() },
    { label: 'Condition', value: vehicle.condition },
    { label: 'Auction Grade', value: vehicle.auctionGrade },
    { label: 'Status', value: statusConfig?.label || vehicle.status },
    { label: 'Featured', value: vehicle.isFeatured ? 'Yes' : 'No' },
    { label: 'Slug', value: vehicle.slug, copyable: true },
  ];

  const pricingFields = [
    { label: 'Price', value: vehicle.price ? formatPrice(vehicle.price) : null },
    { label: 'Currency', value: rel('currencyName') ?? rel('currencyCode') },
  ];

  const specificationFields = [
    { label: 'Manufacturer', value: rel('manufacturerName') },
    { label: 'Model', value: rel('modelName') },
    { label: 'Body Type', value: rel('bodyTypeName') },
    { label: 'Fuel Type', value: rel('fuelTypeName') },
    { label: 'Transmission', value: rel('transmissionName') },
    { label: 'Drive Type', value: rel('driveTypeName') },
    { label: 'Color', value: rel('colorName') },
    { label: 'Country', value: rel('countryName') },
    { label: 'Port', value: rel('portName') },
  ];

  const engineFields = [
    { label: 'Engine CC', value: vehicle.engineCc?.toString() },
    { label: 'Horsepower', value: vehicle.horsepower ? `${vehicle.horsepower} HP` : null },
  ];

  const dimensionFields = [
    { label: 'Mileage', value: vehicle.mileage ? `${formatMileage(vehicle.mileage)} km` : null },
    { label: 'Doors', value: vehicle.doors?.toString() },
    { label: 'Seats', value: vehicle.seats?.toString() },
  ];

  const metaFields = [
    { label: 'Meta Title', value: (vehicle as unknown as Record<string, unknown>).metaTitle as string | null },
    { label: 'Meta Description', value: (vehicle as unknown as Record<string, unknown>).metaDescription as string | null },
  ];

  const activityTimeline: TimelineActivity[] = [
    {
      id: '1',
      type: 'status_changed',
      actor: { name: 'Admin', email: 'admin@zafautos.com' },
      target: { type: 'vehicle', name: `${vehicle.year ?? ''} vehicle`, id: vehicle.id },
      details: { status: { old: 'draft', new: vehicle.status } },
      timestamp: vehicle.updatedAt,
    },
    {
      id: '2',
      type: 'created',
      actor: { name: 'Admin', email: 'admin@zafautos.com' },
      target: { type: 'vehicle', name: `${vehicle.year ?? ''} vehicle`, id: vehicle.id },
      timestamp: vehicle.createdAt,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-pure-white font-[Oswald] uppercase tracking-wide">
              {vehicleName}
            </h1>
            <StatusChip
              label={statusConfig?.label || vehicle.status}
              variant={getStatusVariant(vehicle.status)}
            />
            {vehicle.isFeatured && (
              <span className="inline-flex items-center gap-1 rounded-[4px] border border-auction-amber/20 bg-auction-amber/10 px-2 py-0.5 text-xs font-medium text-auction-amber">
                <Star className="size-3 fill-auction-amber" /> Featured
              </span>
            )}
          </div>
          <p className="text-sm text-ash">
            {vehicle.vin && `VIN: ${vehicle.vin}`}
            {vehicle.vin && vehicle.stockNumber && ' · '}
            {vehicle.stockNumber && `Stock: ${vehicle.stockNumber}`}
          </p>
          {vehicle.price != null && (
            <p className="text-lg font-bold text-pure-white">{formatPrice(vehicle.price)}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/vehicles">
              <ArrowLeft className="mr-1 size-4" />
              Back
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/vehicles/${vehicleId}/edit`}>
              <Edit className="mr-1 size-4" />
              Edit
            </Link>
          </Button>
          {vehicle.status === 'draft' && (
            <Button
              size="sm"
              disabled={actionLoading}
              onClick={() => handleAction(() => publishVehicle(vehicleId), 'Vehicle published')}
            >
              Publish
            </Button>
          )}
          {vehicle.status === 'active' && (
            <Button
              variant="secondary"
              size="sm"
              disabled={actionLoading}
              onClick={() => handleAction(() => archiveVehicle(vehicleId), 'Vehicle archived')}
            >
              Archive
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={actionLoading}
            onClick={() =>
              handleAction(
                () => toggleVehicleFeatured(vehicleId),
                vehicle.isFeatured ? 'Removed from featured' : 'Added to featured'
              )
            }
            title={vehicle.isFeatured ? 'Remove from featured' : 'Add to featured'}
          >
            {vehicle.isFeatured ? (
              <StarOff className="size-4 text-auction-amber" />
            ) : (
              <Star className="size-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setStatusDialogOpen(true)}
            title="Change status"
          >
            <MoreVertical className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setDeleteDialogOpen(true)}
            title="Delete vehicle"
          >
            <Trash2 className="size-4 text-signal-red" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-iron/30">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'border-signal-red text-signal-red'
                : 'border-transparent text-steel hover:text-pure-white'
            )}
          >
            <tab.icon className="size-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {primaryImage && (
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[10px] border border-iron/30">
              <Image
                src={primaryImage.imageUrl}
                alt={vehicleName}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          {!primaryImage && (
            <div className="rounded-[10px] border border-auction-amber/30 bg-auction-amber/5 p-4 flex items-center gap-3">
              <AlertTriangle className="size-5 text-auction-amber shrink-0" />
              <div>
                <p className="text-sm font-medium text-auction-amber">No images uploaded</p>
                <p className="text-xs text-steel">Upload images in the Gallery tab to showcase this vehicle.</p>
              </div>
            </div>
          )}

          <div className="rounded-[10px] border border-iron/30 bg-carbon p-4">
            <h3 className="text-sm font-medium text-pure-white mb-3">Completeness</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { label: 'Images', ok: vehicle.images.length > 0, detail: `${vehicle.images.length} uploaded` },
                { label: 'VIN', ok: !!vehicle.vin },
                { label: 'Price', ok: vehicle.price != null && vehicle.price > 0 },
                { label: 'Year', ok: vehicle.year != null },
                { label: 'Manufacturer', ok: !!vehicle.manufacturerId },
                { label: 'Model', ok: !!vehicle.modelId },
                { label: 'Body Type', ok: !!vehicle.bodyTypeId },
                { label: 'Fuel Type', ok: !!vehicle.fuelTypeId },
                { label: 'Transmission', ok: !!vehicle.transmissionId },
                { label: 'Mileage', ok: vehicle.mileage != null },
                { label: 'Country', ok: !!vehicle.countryId },
                { label: 'Documents', ok: false, async: true },
              ].map((item) => (
                <div
                  key={item.label}
                  className={cn(
                    'flex items-center gap-2 rounded-[6px] px-3 py-2 text-xs',
                    item.ok
                      ? 'bg-available-green/10 text-available-green'
                      : 'bg-signal-red/10 text-signal-red'
                  )}
                >
                  {item.ok ? <Check className="size-3.5 shrink-0" /> : <X className="size-3.5 shrink-0" />}
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <DetailGroup title="Basic Information">
            <DetailGrid fields={basicFields} columns={4} />
          </DetailGroup>

          <DetailGroup title="Pricing">
            <DetailGrid fields={pricingFields} columns={4} />
          </DetailGroup>

          <DetailGroup title="Specifications">
            <DetailGrid fields={specificationFields} columns={3} />
          </DetailGroup>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <DetailGroup title="Engine">
              <DetailGrid fields={engineFields} columns={2} />
            </DetailGroup>
            <DetailGroup title="Dimensions">
              <DetailGrid fields={dimensionFields} columns={2} />
            </DetailGroup>
          </div>

          <DetailGroup title="Quick Actions">
            <div className="flex flex-wrap gap-2">
              {vehicle.vin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(vehicle.vin!, 'VIN')}
                >
                  <Copy className="mr-1 size-3.5" />
                  Copy VIN
                </Button>
              )}
              {vehicle.stockNumber && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(vehicle.stockNumber!, 'Stock Number')}
                >
                  <Copy className="mr-1 size-3.5" />
                  Copy Stock #
                </Button>
              )}
              {vehicle.slug && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(`${window.location.origin}/vehicles/${vehicle.slug}`, 'URL')}
                >
                  <ExternalLink className="mr-1 size-3.5" />
                  Copy URL
                </Button>
              )}
            </div>
          </DetailGroup>
        </div>
      )}

      {activeTab === 'specifications' && (
        <div className="space-y-6">
          <DetailGroup title="Engine & Performance">
            <DetailGrid fields={[
              { label: 'Engine CC', value: vehicle.engineCc?.toString() },
              { label: 'Horsepower', value: vehicle.horsepower ? `${vehicle.horsepower} HP` : null },
              { label: 'Fuel Type', value: rel('fuelTypeName') },
              { label: 'Transmission', value: rel('transmissionName') },
              { label: 'Drive Type', value: rel('driveTypeName') },
            ]} columns={3} />
          </DetailGroup>
          <DetailGroup title="Dimensions & Body">
            <DetailGrid fields={[
              { label: 'Body Type', value: rel('bodyTypeName') },
              { label: 'Doors', value: vehicle.doors?.toString() },
              { label: 'Seats', value: vehicle.seats?.toString() },
              { label: 'Color', value: rel('colorName') },
              { label: 'Mileage', value: vehicle.mileage ? `${formatMileage(vehicle.mileage)} km` : null },
            ]} columns={3} />
          </DetailGroup>
          <VehicleSpecsSection vehicleId={vehicleId} />
        </div>
      )}

      {activeTab === 'gallery' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-pure-white">
              Images ({vehicle.images.length})
            </h3>
            <div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <Button
                size="sm"
                asChild
                disabled={uploading}
              >
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Upload className="mr-1 size-4" />
                  {uploading ? 'Uploading...' : 'Upload Images'}
                </label>
              </Button>
            </div>
          </div>

          {vehicle.images.length === 0 ? (
            <EmptyState
              title="No images"
              description="Upload images to showcase this vehicle."
              icon={ImageIcon}
              action={
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Button size="sm" asChild>
                    <span>
                      <Upload className="mr-1 size-4" />
                      Upload Images
                    </span>
                  </Button>
                </label>
              }
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {sortedImages.map((image) => (
                <div
                  key={image.id}
                  className={cn(
                    'group relative aspect-square overflow-hidden rounded-[10px] border transition-colors',
                    image.isPrimary
                      ? 'border-signal-red'
                      : 'border-iron/30 hover:border-iron'
                  )}
                >
                  <Image
                    src={image.imageUrl}
                    alt={`Vehicle image ${image.sortOrder + 1}`}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between p-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="flex gap-1">
                      {!image.isPrimary && (
                        <button
                          onClick={() => handleSetPrimary(image.id)}
                          className="rounded bg-carbon/80 p-1.5 text-pure-white transition-colors hover:bg-carbon"
                          title="Set as primary"
                        >
                          <Star className="size-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteImage(image.id)}
                        className="rounded bg-carbon/80 p-1.5 text-signal-red transition-colors hover:bg-carbon"
                        title="Delete image"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                    {image.isPrimary && (
                      <span className="rounded bg-signal-red/80 px-1.5 py-0.5 text-[10px] font-medium text-pure-white">
                        Primary
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'pricing' && (
        <div className="space-y-6">
          <DetailGroup title="Pricing Information">
            <DetailGrid fields={[
              { label: 'Price', value: vehicle.price ? formatPrice(vehicle.price) : null },
              { label: 'Auction Grade', value: vehicle.auctionGrade },
              { label: 'Condition', value: vehicle.condition },
            ]} columns={3} />
          </DetailGroup>
        </div>
      )}

      {activeTab === 'documents' && (
        <VehicleDocumentsSection vehicleId={vehicleId} />
      )}

      {activeTab === 'features' && (
        <VehicleFeaturesSection vehicleId={vehicleId} />
      )}

      {activeTab === 'shipping' && (
        <div className="space-y-6">
          <DetailGroup title="Shipping & Destination">
            <DetailGrid fields={[
              { label: 'Country', value: rel('countryName') },
              { label: 'Port', value: rel('portName') },
            ]} columns={2} />
          </DetailGroup>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="space-y-6">
          <DetailGroup title="Status History">
            <VehicleStatusHistory vehicleId={vehicleId} />
          </DetailGroup>
          <div className="rounded-[10px] border border-iron/30 bg-carbon p-6">
            <ActivityTimeline
              activities={activityTimeline}
              emptyMessage="No activity recorded for this vehicle yet."
            />
          </div>
        </div>
      )}

      {activeTab === 'seo' && (
        <div className="space-y-6">
          <DetailGroup title="SEO Information">
            <DetailGrid fields={metaFields} columns={2} />
          </DetailGroup>
          {vehicle.slug && (
            <DetailGroup title="Public URL">
              <DetailField
                label="URL"
                value={
                  <a
                    href={`/vehicles/${vehicle.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-signal-red hover:underline"
                  >
                    /vehicles/{vehicle.slug}
                  </a>
                }
              />
            </DetailGroup>
          )}
        </div>
      )}

      <VehicleDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        vehicleId={vehicleId}
        vehicleName={vehicleName}
        onDeleted={() => router.push('/admin/vehicles')}
      />

      <VehicleStatusDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        vehicleId={vehicleId}
        currentStatus={vehicle.status as VehicleStatus}
        onStatusChanged={fetchVehicle}
      />
    </div>
  );
}
