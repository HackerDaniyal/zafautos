'use client';

import { SubEntityPage } from '@/app/(admin)/admin/vehicles/components/sub-entity-page';
import { listManufacturers, createManufacturer, updateManufacturer, deleteManufacturer } from '@/server/actions/vehicleActions';

export function MakesClient() {
  return (
    <SubEntityPage
      title="Makes"
      description="Vehicle manufacturers"
      addActionLabel="Add Make"
      listAction={listManufacturers}
      createAction={(data) => createManufacturer(data)}
      updateAction={(id, data) => updateManufacturer(id, data)}
      deleteAction={deleteManufacturer}
    />
  );
}
