'use client';

import { SubEntityPage } from '@/app/(admin)/admin/vehicles/components/sub-entity-page';
import {
  listDriveTypes,
  createDriveType,
  updateDriveType,
  deleteDriveType,
  getVehicleLookupCounts,
} from '@/server/actions/vehicleActions';

export function DriveTypesClient() {
  return (
    <SubEntityPage
      title="Drive Types"
      description="Vehicle drive configurations"
      addActionLabel="Add Drive Type"
      singular="drive type"
      listAction={listDriveTypes}
      createAction={(data) => createDriveType(data as { name: string })}
      updateAction={(id, data) => updateDriveType(id, data as { name: string })}
      deleteAction={deleteDriveType}
      category="driveType"
      countAction={() => getVehicleLookupCounts('driveType')}
    />
  );
}
