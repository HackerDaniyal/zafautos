'use client';

import { SubEntityPage } from '@/app/(admin)/admin/vehicles/components/sub-entity-page';
import {
  listTransmissions,
  createTransmission,
  updateTransmission,
  deleteTransmission,
  getVehicleLookupCounts,
} from '@/server/actions/vehicleActions';

export function TransmissionsClient() {
  return (
    <SubEntityPage
      title="Transmissions"
      description="Vehicle transmission types"
      addActionLabel="Add Transmission"
      singular="transmission"
      listAction={listTransmissions}
      createAction={(data) => createTransmission(data as { name: string })}
      updateAction={(id, data) => updateTransmission(id, data as { name: string })}
      deleteAction={deleteTransmission}
      category="transmission"
      countAction={() => getVehicleLookupCounts('transmission')}
    />
  );
}
