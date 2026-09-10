'use client';

import { SubEntityPage } from '@/app/(admin)/admin/vehicles/components/sub-entity-page';
import { MakeLogo } from '@/components/admin/vehicles/entity-visuals';
import {
  listModels,
  createModel,
  updateModel,
  deleteModel,
  getVehicleLookupCounts,
  listManufacturers,
} from '@/server/actions/vehicleActions';

export function ModelsClient() {
  return (
    <SubEntityPage
      title="Models"
      description="Vehicle models"
      addActionLabel="Add Model"
      singular="model"
      listAction={listModels}
      createAction={(data) => createModel(data as { name: string; slug?: string; manufacturerId?: string })}
      updateAction={(id, data) => updateModel(id, data as { name?: string; slug?: string; manufacturerId?: string | null })}
      deleteAction={deleteModel}
      extraFields={[
        { key: 'manufacturerId', label: 'Make', type: 'select', required: true, optionsAction: listManufacturers },
      ]}
      category="model"
      countAction={() => getVehicleLookupCounts('model')}
      renderVisual={(item) => (
        <span className="flex size-8 items-center justify-center rounded-[6px] border border-iron/30 bg-deep-carbon p-1">
          <MakeLogo
            name={String(item.manufacturerId ?? '')}
            url={undefined}
            className="size-6"
          />
        </span>
      )}
    />
  );
}