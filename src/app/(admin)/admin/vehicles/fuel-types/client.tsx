'use client';

import { SubEntityPage } from '@/app/(admin)/admin/vehicles/components/sub-entity-page';
import { listFuelTypes, createFuelType, updateFuelType, deleteFuelType } from '@/server/actions/vehicleActions';

export function FuelTypesClient() {
  return (
    <SubEntityPage
      title="Fuel Types"
      description="Vehicle fuel types"
      addActionLabel="Add Fuel Type"
      listAction={listFuelTypes}
      createAction={(data) => createFuelType(data)}
      updateAction={(id, data) => updateFuelType(id, data)}
      deleteAction={deleteFuelType}
    />
  );
}
