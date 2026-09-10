'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/admin/ui/page-header';
import { useToast } from '@/components/admin/ui/use-toast';
import {
  createVehicle,
  updateVehicle,
  getVehicleForEdit,
  listManufacturers,
  listModels,
  listBodyTypes,
  listFuelTypes,
  listTransmissions,
  listDriveTypes,
  listColors,
  listCountries,
  listPorts,
  uploadVehicleImages,
  deleteVehicleImage,
  setVehiclePrimaryImage,
  getVehicleDestinationCountries,
  setVehicleDestinationCountries,
} from '@/server/actions/vehicleActions';
import { listCurrencies } from '@/server/actions/currenciesActions';
import { resolveVehicleImageUrl } from '@/lib/utils/vehicle-images';
import { VehicleFormSteps, STEP_REQUIRED_FIELDS, type VehicleFormImage, type VehicleFormOptions } from './vehicle-form-steps';
import type { VehicleFormData } from '../types';
import { VEHICLE_FORM_STEPS, type VehicleFormStep } from '../constants';

interface ExistingImage {
  id: string;
  imageUrl: string;
  isPrimary: boolean;
  sortOrder: number;
}

interface VehicleFormPageProps {
  mode: 'create' | 'edit';
  vehicleId?: string;
}

function extractOptionList(data: unknown): { id: string; name: string; manufacturerId?: string }[] {
  if (Array.isArray(data)) return data as { id: string; name: string; manufacturerId?: string }[];
  if (data && typeof data === 'object' && Array.isArray((data as { data?: unknown }).data)) {
    return (data as { data: { id: string; name: string; manufacturerId?: string }[] }).data;
  }
  return [];
}

function validateStep(step: VehicleFormStep, formData: VehicleFormData): Record<string, string> {
  const required = STEP_REQUIRED_FIELDS[step];
  const errors: Record<string, string> = {};

  for (const field of required) {
    const value = formData[field];
    if (value === null || value === undefined || value === '' || value === false) {
      switch (field) {
        case 'manufacturerId':
          errors.manufacturerId = 'Make is required';
          break;
        case 'modelId':
          errors.modelId = 'Model is required';
          break;
        case 'year':
          errors.year = 'Year is required';
          break;
        case 'fuelTypeId':
          errors.fuelTypeId = 'Fuel type is required';
          break;
        case 'transmissionId':
          errors.transmissionId = 'Transmission is required';
          break;
        default:
          errors[field] = 'This field is required';
      }
    }
  }

  if (step === 'basic') {
    if (formData.year != null && (formData.year < 1900 || formData.year > new Date().getFullYear() + 1)) {
      errors.year = `Year must be between 1900 and ${new Date().getFullYear() + 1}`;
    }
  }

  return errors;
}

export function VehicleFormPage({ mode, vehicleId }: VehicleFormPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = React.useState<VehicleFormStep>('basic');
  const [formData, setFormData] = React.useState<VehicleFormData>({});
  const [existingVehicle, setExistingVehicle] = React.useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = React.useState(mode === 'edit');
  const [submitting, setSubmitting] = React.useState(false);
  const [stepErrors, setStepErrors] = React.useState<Record<string, string>>({});
  const [images, setImages] = React.useState<VehicleFormImage[]>([]);
  const [existingImages, setExistingImages] = React.useState<ExistingImage[]>([]);
  const [options, setOptions] = React.useState<VehicleFormOptions>({
    manufacturers: [],
    models: [],
    bodyTypes: [],
    fuelTypes: [],
    transmissions: [],
    driveTypes: [],
    colors: [],
    countries: [],
    currencies: [],
    ports: [],
  });

  React.useEffect(() => {
    if (mode === 'edit' && vehicleId) {
      Promise.all([
        getVehicleForEdit(vehicleId),
        getVehicleDestinationCountries(vehicleId),
      ]).then(([editResult, destResult]) => {
        if (editResult.success && editResult.data) {
          const vehicle = editResult.data as Record<string, unknown>;
          setExistingVehicle(vehicle);
          setFormData({
            vin: vehicle.vin as string | null,
            stockNumber: vehicle.stockNumber as string | null,
            manufacturerId: vehicle.manufacturerId as string | null,
            modelId: vehicle.modelId as string | null,
            bodyTypeId: vehicle.bodyTypeId as string | null,
            year: vehicle.year as number | null,
            condition: vehicle.condition as string | null,
            price: vehicle.price as number | null,
            currencyId: vehicle.currencyId as string | null,
            fuelTypeId: vehicle.fuelTypeId as string | null,
            transmissionId: vehicle.transmissionId as string | null,
            driveTypeId: vehicle.driveTypeId as string | null,
            colorId: vehicle.colorId as string | null,
            engineCc: vehicle.engineCc as number | null,
            horsepower: vehicle.horsepower as number | null,
            mileage: vehicle.mileage as number | null,
            doors: vehicle.doors as number | null,
            seats: vehicle.seats as number | null,
            auctionGrade: vehicle.auctionGrade as string | null,
            countryId: vehicle.countryId as string | null,
            portId: vehicle.portId as string | null,
            status: (vehicle.status as VehicleFormData['status']) ?? 'draft',
            isFeatured: (vehicle.isFeatured as boolean) ?? false,
            slug: vehicle.slug as string | null,
            destinationCountryIds: destResult.success ? (destResult.data ?? []) : [],
          });
          const rawImages = vehicle.images as Array<{ id: string; imageUrl: string; isPrimary: boolean; sortOrder: number }> | undefined;
          if (rawImages && rawImages.length > 0) {
            setExistingImages(
              rawImages
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((img) => ({
                  id: img.id,
                  imageUrl: resolveVehicleImageUrl(img.imageUrl),
                  isPrimary: img.isPrimary,
                  sortOrder: img.sortOrder,
                }))
            );
          }
        } else {
          toast({ title: 'Error', description: 'Vehicle not found', variant: 'error' });
          router.push('/admin/vehicles');
        }
      }).finally(() => setLoading(false));
    }
  }, [mode, vehicleId, router, toast]);

  React.useEffect(() => {
    let cancelled = false;
    async function loadOptions() {
      try {
        const results = await Promise.all([
          listManufacturers(),
          listModels(),
          listBodyTypes(),
          listFuelTypes(),
          listTransmissions(),
          listDriveTypes(),
          listColors(),
          listCountries(),
          listCurrencies(),
          listPorts(),
        ]);
        if (cancelled) return;
        const r = results as Array<{ success: boolean; data?: unknown }>;
        setOptions({
          manufacturers: extractOptionList(r[0].data),
          models: extractOptionList(r[1].data),
          bodyTypes: extractOptionList(r[2].data),
          fuelTypes: extractOptionList(r[3].data),
          transmissions: extractOptionList(r[4].data),
          driveTypes: extractOptionList(r[5].data),
          colors: extractOptionList(r[6].data),
          countries: extractOptionList(r[7].data),
          currencies: extractOptionList(r[8].data),
          ports: extractOptionList(r[9].data),
        });
      } catch {
        if (!cancelled) {
          toast({ title: 'Error', description: 'Failed to load form options', variant: 'error' });
        }
      }
    }
    loadOptions();
    return () => { cancelled = true; };
  }, [toast]);

  function handleFieldChange(field: keyof VehicleFormData, value: unknown) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (stepErrors[field]) {
      setStepErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  async function handleDeleteExistingImage(imageId: string) {
    const result = await deleteVehicleImage(imageId);
    if (result.success) {
      setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
      toast({ title: 'Image deleted', variant: 'success' });
    } else {
      toast({ title: 'Error', description: result.error, variant: 'error' });
    }
  }

  async function handleSetExistingPrimary(imageId: string) {
    if (!vehicleId) return;
    const result = await setVehiclePrimaryImage(vehicleId, imageId);
    if (result.success) {
      setExistingImages((prev) =>
        prev.map((img) => ({ ...img, isPrimary: img.id === imageId }))
      );
      toast({ title: 'Primary image updated', variant: 'success' });
    } else {
      toast({ title: 'Error', description: result.error, variant: 'error' });
    }
  }

  function handleNext() {
    const errors = validateStep(currentStep, formData);
    if (Object.keys(errors).length > 0) {
      setStepErrors(errors);
      toast({
        title: 'Please fill required fields',
        description: Object.values(errors)[0],
        variant: 'error',
      });
      return;
    }
    setStepErrors({});
    const idx = VEHICLE_FORM_STEPS.findIndex((s) => s.id === currentStep);
    if (idx < VEHICLE_FORM_STEPS.length - 1) {
      setCurrentStep(VEHICLE_FORM_STEPS[idx + 1].id);
    }
  }

  function handlePrevious() {
    setStepErrors({});
    const idx = VEHICLE_FORM_STEPS.findIndex((s) => s.id === currentStep);
    if (idx > 0) {
      setCurrentStep(VEHICLE_FORM_STEPS[idx - 1].id);
    }
  }

  async function handleSubmit(statusOverride?: 'draft' | 'active') {
    setSubmitting(true);
    try {
      const status = statusOverride ?? formData.status ?? 'draft' as const;
      const submitData = { ...formData, status, isFeatured: formData.isFeatured ?? false };
      let result;

      if (mode === 'create') {
        result = await createVehicle(submitData);
        if (result.success) {
          const vehicle = result.data as { id: string } | undefined;
          if (vehicle?.id) {
            const destIds = formData.destinationCountryIds ?? [];
            if (destIds.length > 0) {
              await setVehicleDestinationCountries(vehicle.id, destIds);
            }
            if (images.length > 0) {
              const formDataObj = new FormData();
              for (const img of images) {
                formDataObj.append('images', img.file);
              }
              await uploadVehicleImages(vehicle.id, formDataObj);
            }
          }
          toast({
            title: status === 'active' ? 'Vehicle published' : 'Vehicle saved as draft',
            description: 'Vehicle has been saved successfully.',
            variant: 'success',
          });
          router.push('/admin/vehicles');
        } else {
          toast({ title: 'Error', description: result.error, variant: 'error' });
        }
      } else if (vehicleId) {
        result = await updateVehicle(vehicleId, submitData);
        if (result.success) {
          await setVehicleDestinationCountries(vehicleId, formData.destinationCountryIds ?? []);
          if (images.length > 0) {
            const formDataObj = new FormData();
            for (const img of images) {
              if (!img.uploading) formDataObj.append('images', img.file);
            }
            if (formDataObj.getAll('images').length > 0) {
              await uploadVehicleImages(vehicleId, formDataObj);
            }
          }
          toast({
            title: status === 'active' ? 'Vehicle published' : 'Vehicle updated',
            description: 'Vehicle has been saved successfully.',
            variant: 'success',
          });
          router.push('/admin/vehicles');
        } else {
          toast({ title: 'Error', description: result.error, variant: 'error' });
        }
      }
    } catch {
      toast({ title: 'Error', description: 'An unexpected error occurred', variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  const stepIndex = VEHICLE_FORM_STEPS.findIndex((s) => s.id === currentStep);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded bg-iron/20" />
        <div className="h-96 animate-pulse rounded-[10px] bg-iron/20" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={mode === 'create' ? 'New Vehicle' : 'Edit Vehicle'}
        description={mode === 'create' ? 'Add a new vehicle to inventory' : `Editing ${existingVehicle?.year ?? ''} vehicle`}
      />

      {/* Step Navigation */}
      <div className="space-y-3">
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {VEHICLE_FORM_STEPS.map((step, index) => (
            <button
              key={step.id}
              type="button"
              onClick={() => {
                setStepErrors({});
                setCurrentStep(step.id);
              }}
              className={`flex items-center gap-2 whitespace-nowrap rounded-[6px] px-3 py-2 text-sm font-medium transition-colors ${
                currentStep === step.id
                  ? 'bg-signal-red/10 text-signal-red'
                  : index < stepIndex
                    ? 'text-available-green hover:bg-white/5'
                    : 'text-steel hover:bg-white/5 hover:text-pure-white'
              }`}
            >
              <span className={`flex size-5 items-center justify-center rounded-full text-xs ${
                index < stepIndex
                  ? 'bg-available-green/20 text-available-green'
                  : currentStep === step.id
                    ? 'bg-signal-red/20 text-signal-red'
                    : 'bg-iron/20 text-steel'
              }`}>
                {index < stepIndex ? '✓' : index + 1}
              </span>
              <span className="hidden sm:inline">{step.label}</span>
            </button>
          ))}
        </div>
        <div className="h-1 w-full rounded-full bg-iron/20">
          <div
            className="h-full rounded-full bg-signal-red transition-all duration-300"
            style={{ width: `${((stepIndex + 1) / VEHICLE_FORM_STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Form Content */}
      <div className="rounded-[10px] border border-iron/30 bg-carbon p-6">
        <VehicleFormSteps
          step={currentStep}
          mode={mode}
          formData={formData}
          onFieldChange={handleFieldChange}
          options={options}
          errors={stepErrors}
          images={images}
          onImagesChange={setImages}
          existingImages={existingImages}
          onDeleteExistingImage={handleDeleteExistingImage}
          onSetExistingPrimary={handleSetExistingPrimary}
        />
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t border-iron/30 pt-4">
        <Button variant="outline" asChild>
          <Link href="/admin/vehicles">
            <ArrowLeft className="mr-2 size-4" />
            Back to Vehicles
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          {stepIndex > 0 && (
            <Button variant="outline" onClick={handlePrevious}>
              Previous
            </Button>
          )}
          {stepIndex < VEHICLE_FORM_STEPS.length - 1 ? (
            <Button onClick={handleNext}>
              Next
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => handleSubmit('draft')}
                disabled={submitting}
              >
                {submitting ? 'Saving...' : 'Save Draft'}
              </Button>
              <Button
                onClick={() => handleSubmit('active')}
                disabled={submitting}
                className="bg-signal-red text-pure-white hover:bg-deep-red"
              >
                {submitting ? 'Publishing...' : 'Save & Publish'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
