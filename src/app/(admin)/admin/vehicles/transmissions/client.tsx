'use client';

import { SubEntityPage } from '@/app/(admin)/admin/vehicles/components/sub-entity-page';
import { listTransmissions, createTransmission, updateTransmission, deleteTransmission } from '@/server/actions/vehicleActions';

export function TransmissionsClient() {
  return (
    <SubEntityPage
      title="Transmissions"
      description="Vehicle transmission types"
      addActionLabel="Add Transmission"
      listAction={listTransmissions}
      createAction={(data) => createTransmission(data)}
      updateAction={(id, data) => updateTransmission(id, data)}
      deleteAction={deleteTransmission}
    />
  );
}
