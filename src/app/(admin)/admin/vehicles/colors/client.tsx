'use client';

import { SubEntityPage } from '@/app/(admin)/admin/vehicles/components/sub-entity-page';
import { listColors, createColor, updateColor, deleteColor } from '@/server/actions/vehicleActions';

export function ColorsClient() {
  return (
    <SubEntityPage
      title="Colors"
      description="Vehicle colors"
      addActionLabel="Add Color"
      listAction={listColors}
      createAction={(data) => createColor(data)}
      updateAction={(id, data) => updateColor(id, data)}
      deleteAction={deleteColor}
    />
  );
}
