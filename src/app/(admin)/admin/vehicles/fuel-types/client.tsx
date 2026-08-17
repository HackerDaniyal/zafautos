'use client';

import { SubEntityPage } from '@/app/(admin)/admin/vehicles/components/sub-entity-page';
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
      category="fuelType"
      countAction={() => getVehicleLookupCounts('fuelType')}
    />
  );
}
