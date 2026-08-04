'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/admin/ui/page-header';
import { useToast } from '@/components/admin/ui/use-toast';
import { createVehicle, updateVehicle, getVehicleForEdit } from '@/server/actions/vehicleActions';
import { CreateVehicleSchema, UpdateVehicleSchema } from '@/lib/validation/vehicle';
import { VehicleFormSteps } from './vehicle-form-steps';
import type { VehicleFormData } from '../types';
import { VEHICLE_FORM_STEPS, type VehicleFormStep } from '../constants';

interface VehicleFormPageProps {
  mode: 'create' | 'edit';
  vehicleId?: string;
}

export function VehicleFormPage({ mode, vehicleId }: VehicleFormPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = React.useState<VehicleFormStep>('basic');
  const [formData, setFormData] = React.useState<VehicleFormData>({});
  const [existingVehicle, setExistingVehicle] = React.useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = React.useState(mode === 'edit');
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (mode === 'edit' && vehicleId) {
      getVehicleForEdit(vehicleId).then((result) => {
        if (result.success && result.data) {
          const vehicle = result.data as Record<string, unknown>;
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
          });
        } else {
          toast({ title: 'Error', description: 'Vehicle not found', variant: 'error' });
          router.push('/admin/vehicles');
        }
      }).finally(() => setLoading(false));
    }
  }, [mode, vehicleId, router, toast]);

  function handleStepChange(step: VehicleFormStep) {
    setCurrentStep(step);
  }

  function handleFieldChange(field: keyof VehicleFormData, value: unknown) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const submitData = { ...formData, status: formData.status ?? 'draft' as const, isFeatured: formData.isFeatured ?? false };
      if (mode === 'create') {
        const result = await createVehicle(submitData);
        if (result.success) {
          toast({ title: 'Vehicle created', description: 'Vehicle has been created successfully.', variant: 'success' });
          router.push('/admin/vehicles');
        } else if (!result.success) {
          toast({ title: 'Error', description: result.error, variant: 'error' });
        }
      } else if (vehicleId) {
        const result = await updateVehicle(vehicleId, submitData);
        if (result.success) {
          toast({ title: 'Vehicle updated', description: 'Vehicle has been updated successfully.', variant: 'success' });
          router.push('/admin/vehicles');
        } else if (!result.success) {
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
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {VEHICLE_FORM_STEPS.map((step, index) => (
          <button
            key={step.id}
            onClick={() => handleStepChange(step.id)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-[6px] px-3 py-2 text-sm font-medium transition-colors ${
              currentStep === step.id
                ? 'bg-signal-red/10 text-signal-red'
                : index < stepIndex
                  ? 'text-available-green hover:bg-white/5'
                  : 'text-steel hover:bg-white/5 hover:text-pure-white'
            }`}
          >
            <span className="flex size-5 items-center justify-center rounded-full bg-current/10 text-xs">
              {index < stepIndex ? '✓' : index + 1}
            </span>
            {step.label}
          </button>
        ))}
      </div>

      {/* Form Content */}
      <div className="rounded-[10px] border border-iron/30 bg-carbon p-6">
        <VehicleFormSteps
          step={currentStep}
          mode={mode}
          formData={formData}
          onFieldChange={handleFieldChange}
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
            <Button
              variant="outline"
              onClick={() => handleStepChange(VEHICLE_FORM_STEPS[stepIndex - 1].id)}
            >
              Previous
            </Button>
          )}
          {stepIndex < VEHICLE_FORM_STEPS.length - 1 ? (
            <Button onClick={() => handleStepChange(VEHICLE_FORM_STEPS[stepIndex + 1].id)}>
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Saving...' : mode === 'create' ? 'Create Vehicle' : 'Save Changes'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
