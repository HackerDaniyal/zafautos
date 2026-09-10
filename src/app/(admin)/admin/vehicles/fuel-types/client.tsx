'use client';

import { SubEntityPage } from '@/app/(admin)/admin/vehicles/components/sub-entity-page';
import { FuelTypeIcon } from '@/components/admin/vehicles/entity-visuals';
import {
  listFuelTypes,
  createFuelType,
  updateFuelType,
  deleteFuelType,
  getVehicleLookupCounts,
} from '@/server/actions/vehicleActions';

export function FuelTypesClient() {
  return (
    <SubEntityPage
      title="Fuel Types"
      description="Vehicle fuel types"
      addActionLabel="Add Fuel Type"
      singular="fuel type"
      listAction={listFuelTypes}
      createAction={(data) => createFuelType(data as { name: string })}
      updateAction={(id, data) => updateFuelType(id, data as { name: string })}
      deleteAction={deleteFuelType}
      namePreview={(name) => <FuelTypeIcon name={name} className="size-9" />}
      renderVisual={(item) => <FuelTypeIcon name={String(item.name)} className="size-6" />}
      category="fuelType"
      countAction={() => getVehicleLookupCounts('fuelType')}
    />
  );
}