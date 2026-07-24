'use client';

import { SubEntityPage } from '@/app/(admin)/admin/vehicles/components/sub-entity-page';
import { listDriveTypes, createDriveType, updateDriveType, deleteDriveType } from '@/server/actions/vehicleActions';

export function DriveTypesClient() {
  return (
    <SubEntityPage
      title="Drive Types"
      description="Vehicle drive types"
      addActionLabel="Add Drive Type"
      listAction={listDriveTypes}
      createAction={(data) => createDriveType(data)}
      updateAction={(id, data) => updateDriveType(id, data)}
      deleteAction={deleteDriveType}
    />
  );
}
