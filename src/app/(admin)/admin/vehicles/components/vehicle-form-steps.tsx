'use client';

import { useState, useRef, useCallback } from 'react';
import { FormField } from '@/components/admin/forms/form-field';
import { SearchableSelect } from '@/components/admin/forms/searchable-select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Upload, ImageIcon, Star } from 'lucide-react';
import { CONDITION_OPTIONS, type VehicleFormStep } from '../constants';
import type { VehicleFormData } from '../types';

export interface VehicleFormOption {
  id: string;
  name: string;
  manufacturerId?: string;
}

export interface VehicleFormOptions {
  manufacturers: VehicleFormOption[];
  models: VehicleFormOption[];
  bodyTypes: VehicleFormOption[];
  fuelTypes: VehicleFormOption[];
  transmissions: VehicleFormOption[];
  driveTypes: VehicleFormOption[];
  colors: VehicleFormOption[];
  countries: VehicleFormOption[];
  currencies: VehicleFormOption[];
  ports: VehicleFormOption[];
  [key: string]: VehicleFormOption[];
}

export interface VehicleFormImage {
  file: File;
  preview: string;
  uploading?: boolean;
}

export interface ExistingImage {
  id: string;
  imageUrl: string;
  isPrimary: boolean;
  sortOrder: number;
}

interface VehicleFormStepsProps {
  step: VehicleFormStep;
  mode: 'create' | 'edit';
  formData: VehicleFormData;
  onFieldChange: (field: keyof VehicleFormData, value: unknown) => void;
  options: VehicleFormOptions;
  errors?: Record<string, string>;
  images?: VehicleFormImage[];
  onImagesChange?: (images: VehicleFormImage[]) => void;
  existingImages?: ExistingImage[];
  onDeleteExistingImage?: (imageId: string) => void;
  onSetExistingPrimary?: (imageId: string) => void;
}

export const STEP_REQUIRED_FIELDS: Record<VehicleFormStep, (keyof VehicleFormData)[]> = {
  basic: ['manufacturerId', 'year'],
  pricing: [],
  specs: ['fuelTypeId', 'transmissionId'],
  features: [],
  media: [],
  seo: [],
  publishing: [],
};

function MultiCountrySelect({ options, selected, onChange, placeholder }: {
  options: VehicleFormOption[];
  selected: string[];
  onChange: (ids: string[]) => void;
  placeholder: string;
}) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = options.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) && !selected.includes(c.id)
  );

  const selectedNames = options.filter((c) => selected.includes(c.id));

  return (
    <div ref={ref} className="relative">
      <div
        className="flex flex-wrap gap-1 min-h-[38px] rounded-md border border-iron/30 bg-deep-carbon px-3 py-1.5 cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        {selectedNames.length === 0 && (
          <span className="text-steel text-sm">{placeholder}</span>
        )}
        {selectedNames.map((c) => (
          <span key={c.id} className="inline-flex items-center gap-1 rounded bg-signal-red/10 px-2 py-0.5 text-xs text-signal-red">
            {c.name}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(selected.filter((id) => id !== c.id)); }}
              className="ml-0.5 hover:text-deep-red"
            >×</button>
          </span>
        ))}
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-md border border-iron/30 bg-carbon shadow-lg">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search countries..."
            className="w-full border-b border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white placeholder:text-steel"
            autoFocus
          />
          {filtered.length === 0 && (
            <p className="px-3 py-2 text-sm text-steel">No countries found</p>
          )}
          {filtered.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => { onChange([...selected, c.id]); setSearch(''); }}
              className="w-full px-3 py-2 text-left text-sm text-pure-white hover:bg-iron/20"
            >
              {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function VehicleFormSteps({ step, mode, formData, onFieldChange, options, errors = {}, images = [], onImagesChange, existingImages = [], onDeleteExistingImage, onSetExistingPrimary }: VehicleFormStepsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredModels = formData.manufacturerId
    ? options.models.filter((m) => m.manufacturerId === formData.manufacturerId)
    : options.models;

  const filteredPorts = options.ports;

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !onImagesChange) return;
    const newImages: VehicleFormImage[] = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    onImagesChange([...images, ...newImages]);
    e.target.value = '';
  }, [images, onImagesChange]);

  const removeImage = useCallback((index: number) => {
    if (!onImagesChange) return;
    URL.revokeObjectURL(images[index].preview);
    onImagesChange(images.filter((_, i) => i !== index));
  }, [images, onImagesChange]);

  const setPrimary = useCallback((index: number) => {
    if (!onImagesChange) return;
    const reordered = [...images];
    const [moved] = reordered.splice(index, 1);
    reordered.unshift(moved);
    onImagesChange(reordered);
  }, [images, onImagesChange]);

  switch (step) {
    case 'basic':
      return (
        <div className="grid gap-6 sm:grid-cols-2">
          <FormField name="manufacturerId" label="Make" required error={errors.manufacturerId}>
            <SearchableSelect
              options={options.manufacturers}
              value={formData.manufacturerId}
              onChange={(v) => {
                onFieldChange('manufacturerId', v);
                if (formData.modelId) {
                  const modelExists = options.models.some((m) => m.id === formData.modelId);
                  if (!modelExists) onFieldChange('modelId', null);
                }
              }}
              placeholder="Search or select make..."
              searchPlaceholder="Type make name..."
            />
          </FormField>
          <FormField name="modelId" label="Model" required error={errors.modelId}>
            <SearchableSelect
              options={filteredModels}
              value={formData.modelId}
              onChange={(v) => onFieldChange('modelId', v)}
              placeholder={formData.manufacturerId ? 'Search or select model...' : 'Select make first'}
              searchPlaceholder="Type model name..."
              disabled={!formData.manufacturerId}
            />
          </FormField>
          <FormField name="year" label="Year" required error={errors.year}>
            <Input
              type="number"
              value={formData.year ?? ''}
              onChange={(e) => onFieldChange('year', e.target.value ? Number(e.target.value) : null)}
              placeholder="e.g. 2024"
              className="bg-deep-carbon border-iron/30 text-pure-white"
            />
          </FormField>
          <FormField name="condition" label="Condition" error={errors.condition}>
            <Select value={formData.condition ?? ''} onValueChange={(v) => onFieldChange('condition', v || null)}>
              <SelectTrigger className="bg-deep-carbon border-iron/30 text-pure-white"><SelectValue placeholder="Select condition" /></SelectTrigger>
              <SelectContent className="bg-carbon border-iron">
                {CONDITION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField name="vin" label="VIN" error={errors.vin}>
            <Input value={formData.vin ?? ''} onChange={(e) => onFieldChange('vin', e.target.value || null)} placeholder="Vehicle Identification Number" className="bg-deep-carbon border-iron/30 text-pure-white" />
          </FormField>
          <FormField name="stockNumber" label="Stock Number" error={errors.stockNumber}>
            <Input value={formData.stockNumber ?? ''} onChange={(e) => onFieldChange('stockNumber', e.target.value || null)} placeholder="Internal stock number" className="bg-deep-carbon border-iron/30 text-pure-white" />
          </FormField>
          <FormField name="bodyTypeId" label="Body Type" error={errors.bodyTypeId}>
            <SearchableSelect
              options={options.bodyTypes}
              value={formData.bodyTypeId}
              onChange={(v) => onFieldChange('bodyTypeId', v)}
              placeholder="Search or select body type..."
              searchPlaceholder="Type body type..."
            />
          </FormField>
          <FormField name="colorId" label="Color" error={errors.colorId}>
            <SearchableSelect
              options={options.colors}
              value={formData.colorId}
              onChange={(v) => onFieldChange('colorId', v)}
              placeholder="Search or select color..."
              searchPlaceholder="Type color..."
            />
          </FormField>
        </div>
      );

    case 'pricing':
      return (
        <div className="grid gap-6 sm:grid-cols-2">
          <FormField name="price" label="Price" error={errors.price}>
            <Input type="number" value={formData.price ?? ''} onChange={(e) => onFieldChange('price', e.target.value ? Number(e.target.value) : null)} placeholder="0" className="bg-deep-carbon border-iron/30 text-pure-white" />
          </FormField>
          <FormField name="currencyId" label="Currency" error={errors.currencyId}>
            <SearchableSelect
              options={options.currencies}
              value={formData.currencyId}
              onChange={(v) => onFieldChange('currencyId', v)}
              placeholder="Search or select currency..."
              searchPlaceholder="Type currency name or code..."
            />
          </FormField>
          <FormField name="auctionGrade" label="Auction Grade" error={errors.auctionGrade}>
            <Input value={formData.auctionGrade ?? ''} onChange={(e) => onFieldChange('auctionGrade', e.target.value || null)} placeholder="e.g. 4.5" className="bg-deep-carbon border-iron/30 text-pure-white" />
          </FormField>
        </div>
      );

    case 'specs':
      return (
        <div className="grid gap-6 sm:grid-cols-2">
          <FormField name="fuelTypeId" label="Fuel Type" required error={errors.fuelTypeId}>
            <SearchableSelect
              options={options.fuelTypes}
              value={formData.fuelTypeId}
              onChange={(v) => onFieldChange('fuelTypeId', v)}
              placeholder="Search or select fuel type..."
              searchPlaceholder="Type fuel type..."
            />
          </FormField>
          <FormField name="transmissionId" label="Transmission" required error={errors.transmissionId}>
            <SearchableSelect
              options={options.transmissions}
              value={formData.transmissionId}
              onChange={(v) => onFieldChange('transmissionId', v)}
              placeholder="Search or select transmission..."
              searchPlaceholder="Type transmission..."
            />
          </FormField>
          <FormField name="driveTypeId" label="Drive Type" error={errors.driveTypeId}>
            <SearchableSelect
              options={options.driveTypes}
              value={formData.driveTypeId}
              onChange={(v) => onFieldChange('driveTypeId', v)}
              placeholder="Search or select drive type..."
              searchPlaceholder="Type drive type..."
            />
          </FormField>
          <FormField name="engineCc" label="Engine (cc)" error={errors.engineCc}>
            <Input type="number" value={formData.engineCc ?? ''} onChange={(e) => onFieldChange('engineCc', e.target.value ? Number(e.target.value) : null)} placeholder="e.g. 2000" className="bg-deep-carbon border-iron/30 text-pure-white" />
          </FormField>
          <FormField name="horsepower" label="Horsepower" error={errors.horsepower}>
            <Input type="number" value={formData.horsepower ?? ''} onChange={(e) => onFieldChange('horsepower', e.target.value ? Number(e.target.value) : null)} placeholder="e.g. 150" className="bg-deep-carbon border-iron/30 text-pure-white" />
          </FormField>
          <FormField name="mileage" label="Mileage (km)" error={errors.mileage}>
            <Input type="number" value={formData.mileage ?? ''} onChange={(e) => onFieldChange('mileage', e.target.value ? Number(e.target.value) : null)} placeholder="e.g. 50000" className="bg-deep-carbon border-iron/30 text-pure-white" />
          </FormField>
          <FormField name="doors" label="Doors" error={errors.doors}>
            <Input type="number" value={formData.doors ?? ''} onChange={(e) => onFieldChange('doors', e.target.value ? Number(e.target.value) : null)} placeholder="e.g. 4" className="bg-deep-carbon border-iron/30 text-pure-white" />
          </FormField>
          <FormField name="seats" label="Seats" error={errors.seats}>
            <Input type="number" value={formData.seats ?? ''} onChange={(e) => onFieldChange('seats', e.target.value ? Number(e.target.value) : null)} placeholder="e.g. 5" className="bg-deep-carbon border-iron/30 text-pure-white" />
          </FormField>
          <FormField name="countryId" label="Origin Country" error={errors.countryId}>
            <SearchableSelect
              options={options.countries}
              value={formData.countryId}
              onChange={(v) => onFieldChange('countryId', v)}
              placeholder="Search country..."
              searchPlaceholder="Type country name..."
            />
          </FormField>
          <FormField name="destinationCountryIds" label="Destination Countries" error={errors.destinationCountryIds}>
            <MultiCountrySelect
              options={options.countries}
              selected={formData.destinationCountryIds ?? []}
              onChange={(v) => onFieldChange('destinationCountryIds', v)}
              placeholder="Select shipping destinations..."
            />
          </FormField>
          <FormField name="portId" label="Port" error={errors.portId}>
            <SearchableSelect
              options={filteredPorts}
              value={formData.portId}
              onChange={(v) => onFieldChange('portId', v)}
              placeholder="Search port..."
              searchPlaceholder="Type port name..."
            />
          </FormField>
        </div>
      );

    case 'features':
      return (
        <div className="space-y-6">
          <FormField name="features" label="Features (one per line)" error={errors.features}>
            <textarea
              value={(formData.features ?? []).join('\n')}
              onChange={(e) => onFieldChange('features', e.target.value.split('\n').filter(Boolean))}
              rows={6}
              placeholder="Sunroof&#10;Leather seats&#10;Bluetooth&#10;Navigation system"
              className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white placeholder:text-steel"
            />
          </FormField>
          <div className="space-y-3">
            <p className="text-sm font-medium text-pure-white">Specifications</p>
            {(formData.specifications ?? []).map((spec, index) => (
              <div key={index} className="flex items-center gap-3">
                <Input
                  value={spec.name}
                  onChange={(e) => {
                    const specs = [...(formData.specifications ?? [])];
                    specs[index] = { ...specs[index], name: e.target.value };
                    onFieldChange('specifications', specs);
                  }}
                  placeholder="Name"
                  className="flex-1 bg-deep-carbon border-iron/30 text-pure-white"
                />
                <Input
                  value={spec.value}
                  onChange={(e) => {
                    const specs = [...(formData.specifications ?? [])];
                    specs[index] = { ...specs[index], value: e.target.value };
                    onFieldChange('specifications', specs);
                  }}
                  placeholder="Value"
                  className="flex-1 bg-deep-carbon border-iron/30 text-pure-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    const specs = (formData.specifications ?? []).filter((_, i) => i !== index);
                    onFieldChange('specifications', specs);
                  }}
                  className="text-steel hover:text-signal-red"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onFieldChange('specifications', [...(formData.specifications ?? []), { name: '', value: '' }])}
            >
              + Add specification
            </Button>
          </div>
        </div>
      );

    case 'media':
      return (
        <div className="space-y-6">
          {mode === 'edit' && existingImages.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-pure-white">Existing Images ({existingImages.length})</h4>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {existingImages.map((img) => (
                  <div
                    key={img.id}
                    className={`group relative aspect-square overflow-hidden rounded-[10px] border transition-colors ${
                      img.isPrimary ? 'border-signal-red' : 'border-iron/30'
                    }`}
                  >
                    <img src={img.imageUrl} alt="" className="size-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between p-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="flex gap-1">
                        {!img.isPrimary && onSetExistingPrimary && (
                          <button
                            type="button"
                            onClick={() => onSetExistingPrimary(img.id)}
                            className="rounded bg-carbon/80 p-1.5 text-pure-white transition-colors hover:bg-carbon"
                            title="Set as primary"
                          >
                            <Star className="size-3.5" />
                          </button>
                        )}
                        {onDeleteExistingImage && (
                          <button
                            type="button"
                            onClick={() => onDeleteExistingImage(img.id)}
                            className="rounded bg-carbon/80 p-1.5 text-signal-red transition-colors hover:bg-carbon"
                            title="Delete image"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </div>
                      {img.isPrimary && (
                        <span className="rounded bg-signal-red/80 px-1.5 py-0.5 text-[10px] font-medium text-pure-white">
                          Primary
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-pure-white">
              {mode === 'edit' ? 'Upload New Images' : 'Vehicle Images'}
            </h4>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center rounded-[10px] border-2 border-dashed border-iron/30 bg-deep-carbon p-8 text-center transition-colors hover:border-signal-red/50"
            >
              <Upload className="mb-3 size-8 text-steel" />
              <p className="text-sm text-ash">Drag images here or click to browse</p>
              <p className="mt-1 text-xs text-steel">JPG, PNG, WEBP — Max 10 MB each — Max 20 images</p>
            </div>
          </div>

          {images.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-pure-white">New Images ({images.length})</h4>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {images.map((img, index) => (
                  <div
                    key={img.preview}
                    className="group relative aspect-square overflow-hidden rounded-[10px] border border-iron/30"
                  >
                    <img
                      src={img.preview}
                      alt={`Upload ${index + 1}`}
                      className="size-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between p-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="flex gap-1">
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => setPrimary(index)}
                            className="rounded bg-carbon/80 p-1.5 text-pure-white transition-colors hover:bg-carbon"
                            title="Set as primary"
                          >
                            <Star className="size-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="rounded bg-carbon/80 p-1.5 text-signal-red transition-colors hover:bg-carbon"
                          title="Remove image"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                      {index === 0 && (
                        <span className="rounded bg-signal-red/80 px-1.5 py-0.5 text-[10px] font-medium text-pure-white">
                          Primary
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {images.length === 0 && existingImages.length === 0 && (
            <p className="text-center text-xs text-steel">No images uploaded yet.</p>
          )}
        </div>
      );

    case 'seo':
      return (
        <div className="space-y-6">
          <FormField name="slug" label="Slug" error={errors.slug}>
            <Input value={formData.slug ?? ''} onChange={(e) => onFieldChange('slug', e.target.value || null)} placeholder="auto-generated-from-title" className="bg-deep-carbon border-iron/30 text-pure-white" />
          </FormField>
          <FormField name="metaTitle" label="Meta Title" error={errors.metaTitle}>
            <Input value={formData.metaTitle ?? ''} onChange={(e) => onFieldChange('metaTitle', e.target.value || null)} placeholder="Page title for search engines" className="bg-deep-carbon border-iron/30 text-pure-white" />
          </FormField>
          <FormField name="metaDescription" label="Meta Description" error={errors.metaDescription}>
            <textarea
              value={formData.metaDescription ?? ''}
              onChange={(e) => onFieldChange('metaDescription', e.target.value || null)}
              rows={3}
              placeholder="Page description for search engines"
              className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white placeholder:text-steel"
            />
          </FormField>
        </div>
      );

    case 'publishing':
      return (
        <div className="space-y-6">
          <FormField name="status" label="Status" error={errors.status}>
            <Select value={formData.status ?? 'draft'} onValueChange={(v) => onFieldChange('status', v)}>
              <SelectTrigger className="bg-deep-carbon border-iron/30 text-pure-white"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-carbon border-iron">
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active (Published)</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField name="isFeatured" label="Featured" error={errors.isFeatured}>
            <div className="flex items-center gap-3">
              <Checkbox
                checked={formData.isFeatured ?? false}
                onCheckedChange={(checked) => onFieldChange('isFeatured', !!checked)}
              />
              <span className="text-sm text-pure-white">Mark as featured vehicle</span>
            </div>
          </FormField>
        </div>
      );

    default:
      return null;
  }
}
