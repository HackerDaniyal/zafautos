'use client';

import { SubEntityPage } from '@/app/(admin)/admin/vehicles/components/sub-entity-page';
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
      extraColumns={[
        {
          header: 'Make',
          render: (item, opts) => (
            <span className="text-sm text-ash">
              {opts.manufacturerId?.find((o) => o.id === item.manufacturerId)?.name ?? '—'}
            </span>
          ),
        },
      ]}
    />
  );
}
