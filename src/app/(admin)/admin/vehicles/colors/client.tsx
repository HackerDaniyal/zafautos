'use client';

import { SubEntityPage } from '@/app/(admin)/admin/vehicles/components/sub-entity-page';
import {
  listColors,
  createColor,
  updateColor,
  deleteColor,
  getVehicleLookupCounts,
} from '@/server/actions/vehicleActions';

export function ColorsClient() {
  return (
    <SubEntityPage
      title="Colors"
      description="Vehicle color options"
      addActionLabel="Add Color"
      singular="color"
      listAction={listColors}
      createAction={(data) => createColor(data as { name: string })}
      updateAction={(id, data) => updateColor(id, data as { name: string })}
      deleteAction={deleteColor}
      category="color"
      countAction={() => getVehicleLookupCounts('color')}
    />
  );
}
