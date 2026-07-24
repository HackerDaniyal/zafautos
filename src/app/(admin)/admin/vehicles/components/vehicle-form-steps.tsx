'use client';

import { FormField } from '@/components/admin/forms/form-field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CONDITION_OPTIONS, type VehicleFormStep } from '../constants';
import type { VehicleFormData } from '../types';

interface VehicleFormStepsProps {
  step: VehicleFormStep;
  mode: 'create' | 'edit';
  formData: VehicleFormData;
  onFieldChange: (field: keyof VehicleFormData, value: unknown) => void;
}

export function VehicleFormSteps({ step, mode, formData, onFieldChange }: VehicleFormStepsProps) {
  switch (step) {
    case 'basic':
      return (
        <div className="grid gap-6 sm:grid-cols-2">
          <FormField name="vin" label="VIN" error={undefined}>
            <Input value={formData.vin ?? ''} onChange={(e) => onFieldChange('vin', e.target.value || null)} placeholder="Vehicle Identification Number" className="bg-deep-carbon border-iron/30 text-pure-white" />
          </FormField>
          <FormField name="stockNumber" label="Stock Number" error={undefined}>
            <Input value={formData.stockNumber ?? ''} onChange={(e) => onFieldChange('stockNumber', e.target.value || null)} placeholder="Internal stock number" className="bg-deep-carbon border-iron/30 text-pure-white" />
          </FormField>
          <FormField name="manufacturerId" label="Make" error={undefined}>
            <Input value={formData.manufacturerId ?? ''} onChange={(e) => onFieldChange('manufacturerId', e.target.value || null)} placeholder="Manufacturer" className="bg-deep-carbon border-iron/30 text-pure-white" />
          </FormField>
          <FormField name="modelId" label="Model" error={undefined}>
            <Input value={formData.modelId ?? ''} onChange={(e) => onFieldChange('modelId', e.target.value || null)} placeholder="Model" className="bg-deep-carbon border-iron/30 text-pure-white" />
          </FormField>
          <FormField name="year" label="Year" error={undefined}>
            <Input type="number" value={formData.year ?? ''} onChange={(e) => onFieldChange('year', e.target.value ? Number(e.target.value) : null)} placeholder="e.g. 2024" className="bg-deep-carbon border-iron/30 text-pure-white" />
          </FormField>
          <FormField name="condition" label="Condition" error={undefined}>
            <Select value={formData.condition ?? ''} onValueChange={(v) => onFieldChange('condition', v || null)}>
              <SelectTrigger className="bg-deep-carbon border-iron/30 text-pure-white"><SelectValue placeholder="Select condition" /></SelectTrigger>
              <SelectContent className="bg-carbon border-iron">
                {CONDITION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField name="bodyTypeId" label="Body Type" error={undefined}>
            <Input value={formData.bodyTypeId ?? ''} onChange={(e) => onFieldChange('bodyTypeId', e.target.value || null)} placeholder="Body type" className="bg-deep-carbon border-iron/30 text-pure-white" />
          </FormField>
          <FormField name="colorId" label="Color" error={undefined}>
            <Input value={formData.colorId ?? ''} onChange={(e) => onFieldChange('colorId', e.target.value || null)} placeholder="Color" className="bg-deep-carbon border-iron/30 text-pure-white" />
          </FormField>
        </div>
      );

    case 'pricing':
      return (
        <div className="grid gap-6 sm:grid-cols-2">
          <FormField name="price" label="Price" error={undefined}>
            <Input type="number" value={formData.price ?? ''} onChange={(e) => onFieldChange('price', e.target.value ? Number(e.target.value) : null)} placeholder="0" className="bg-deep-carbon border-iron/30 text-pure-white" />
          </FormField>
          <FormField name="currencyId" label="Currency" error={undefined}>
            <Input value={formData.currencyId ?? ''} onChange={(e) => onFieldChange('currencyId', e.target.value || null)} placeholder="Currency ID" className="bg-deep-carbon border-iron/30 text-pure-white" />
          </FormField>
          <FormField name="auctionGrade" label="Auction Grade" error={undefined}>
            <Input value={formData.auctionGrade ?? ''} onChange={(e) => onFieldChange('auctionGrade', e.target.value || null)} placeholder="e.g. 4.5" className="bg-deep-carbon border-iron/30 text-pure-white" />
          </FormField>
        </div>
      );

    case 'specs':
      return (
        <div className="grid gap-6 sm:grid-cols-2">
          <FormField name="fuelTypeId" label="Fuel Type" error={undefined}>
            <Input value={formData.fuelTypeId ?? ''} onChange={(e) => onFieldChange('fuelTypeId', e.target.value || null)} placeholder="Fuel type" className="bg-deep-carbon border-iron/30 text-pure-white" />
          </FormField>
          <FormField name="transmissionId" label="Transmission" error={undefined}>
            <Input value={formData.transmissionId ?? ''} onChange={(e) => onFieldChange('transmissionId', e.target.value || null)} placeholder="Transmission" className="bg-deep-carbon border-iron/30 text-pure-white" />
          </FormField>
          <FormField name="driveTypeId" label="Drive Type" error={undefined}>
            <Input value={formData.driveTypeId ?? ''} onChange={(e) => onFieldChange('driveTypeId', e.target.value || null)} placeholder="e.g. AWD, FWD" className="bg-deep-carbon border-iron/30 text-pure-white" />
          </FormField>
          <FormField name="engineCc" label="Engine (cc)" error={undefined}>
            <Input type="number" value={formData.engineCc ?? ''} onChange={(e) => onFieldChange('engineCc', e.target.value ? Number(e.target.value) : null)} placeholder="e.g. 2000" className="bg-deep-carbon border-iron/30 text-pure-white" />
          </FormField>
          <FormField name="horsepower" label="Horsepower" error={undefined}>
            <Input type="number" value={formData.horsepower ?? ''} onChange={(e) => onFieldChange('horsepower', e.target.value ? Number(e.target.value) : null)} placeholder="e.g. 150" className="bg-deep-carbon border-iron/30 text-pure-white" />
          </FormField>
          <FormField name="mileage" label="Mileage (km)" error={undefined}>
            <Input type="number" value={formData.mileage ?? ''} onChange={(e) => onFieldChange('mileage', e.target.value ? Number(e.target.value) : null)} placeholder="e.g. 50000" className="bg-deep-carbon border-iron/30 text-pure-white" />
          </FormField>
          <FormField name="doors" label="Doors" error={undefined}>
            <Input type="number" value={formData.doors ?? ''} onChange={(e) => onFieldChange('doors', e.target.value ? Number(e.target.value) : null)} placeholder="e.g. 4" className="bg-deep-carbon border-iron/30 text-pure-white" />
          </FormField>
          <FormField name="seats" label="Seats" error={undefined}>
            <Input type="number" value={formData.seats ?? ''} onChange={(e) => onFieldChange('seats', e.target.value ? Number(e.target.value) : null)} placeholder="e.g. 5" className="bg-deep-carbon border-iron/30 text-pure-white" />
          </FormField>
          <FormField name="countryId" label="Country" error={undefined}>
            <Input value={formData.countryId ?? ''} onChange={(e) => onFieldChange('countryId', e.target.value || null)} placeholder="Country" className="bg-deep-carbon border-iron/30 text-pure-white" />
          </FormField>
          <FormField name="portId" label="Port" error={undefined}>
            <Input value={formData.portId ?? ''} onChange={(e) => onFieldChange('portId', e.target.value || null)} placeholder="Port" className="bg-deep-carbon border-iron/30 text-pure-white" />
          </FormField>
        </div>
      );

    case 'features':
      return (
        <div className="space-y-6">
          <FormField name="features" label="Features (one per line)" error={undefined}>
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
                  onClick={() => {
                    const specs = (formData.specifications ?? []).filter((_, i) => i !== index);
                    onFieldChange('specifications', specs);
                  }}
                  className="text-steel hover:text-signal-red"
                >
                  ✕
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
          <p className="text-sm text-ash">Image management will be available after creating the vehicle. Save this vehicle first, then upload images from the detail page.</p>
        </div>
      );

    case 'seo':
      return (
        <div className="space-y-6">
          <FormField name="slug" label="Slug" error={undefined}>
            <Input value={formData.slug ?? ''} onChange={(e) => onFieldChange('slug', e.target.value || null)} placeholder="auto-generated-from-title" className="bg-deep-carbon border-iron/30 text-pure-white" />
          </FormField>
          <FormField name="metaTitle" label="Meta Title" error={undefined}>
            <Input value={formData.metaTitle ?? ''} onChange={(e) => onFieldChange('metaTitle', e.target.value || null)} placeholder="Page title for search engines" className="bg-deep-carbon border-iron/30 text-pure-white" />
          </FormField>
          <FormField name="metaDescription" label="Meta Description" error={undefined}>
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
          <FormField name="status" label="Status" error={undefined}>
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
          <FormField name="isFeatured" label="Featured" error={undefined}>
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
