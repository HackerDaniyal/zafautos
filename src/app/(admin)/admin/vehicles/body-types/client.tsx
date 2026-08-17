'use client';

import { SubEntityPage } from '@/app/(admin)/admin/vehicles/components/sub-entity-page';
import {
  listBodyTypes,
  createBodyType,
  updateBodyType,
  deleteBodyType,
  getVehicleLookupCounts,
} from '@/server/actions/vehicleActions';

export function BodyTypesClient() {
  return (
    <SubEntityPage
      title="Body Types"
      description="Vehicle body configurations"
      addActionLabel="Add Body Type"
      singular="body type"
      listAction={listBodyTypes}
      createAction={(data) => createBodyType(data as { name: string })}
      updateAction={(id, data) => updateBodyType(id, data as { name: string })}
      deleteAction={deleteBodyType}
      category="bodyType"
      countAction={() => getVehicleLookupCounts('bodyType')}
    />
  );
}
