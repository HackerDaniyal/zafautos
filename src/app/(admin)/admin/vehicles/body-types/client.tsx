'use client';

import { SubEntityPage } from '@/app/(admin)/admin/vehicles/components/sub-entity-page';
import { listBodyTypes, createBodyType, updateBodyType, deleteBodyType } from '@/server/actions/vehicleActions';

export function BodyTypesClient() {
  return (
    <SubEntityPage
      title="Body Types"
      description="Vehicle body types"
      addActionLabel="Add Body Type"
      listAction={listBodyTypes}
      createAction={(data) => createBodyType(data)}
      updateAction={(id, data) => updateBodyType(id, data)}
      deleteAction={deleteBodyType}
    />
  );
}
