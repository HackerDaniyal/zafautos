'use client';

import { SubEntityPage } from '@/app/(admin)/admin/vehicles/components/sub-entity-page';
import { ColorSwatch } from '@/components/admin/vehicles/entity-visuals';
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
      createAction={(data) => createColor(data as { name: string; hexCode?: string | null })}
      updateAction={(id, data) => updateColor(id, data as { name?: string; hexCode?: string | null })}
      deleteAction={deleteColor}
      extraFields={[
        { key: 'hexCode', label: 'Color', type: 'color' },
      ]}
      renderVisual={(item) => <ColorSwatch hex={item.hexCode as string | null} name={item.name} />}
      category="color"
      countAction={() => getVehicleLookupCounts('color')}
    />
  );
}