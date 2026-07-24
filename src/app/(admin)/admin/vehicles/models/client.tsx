'use client';

import { SubEntityPage } from '@/app/(admin)/admin/vehicles/components/sub-entity-page';
import { listModels, createModel, updateModel, deleteModel } from '@/server/actions/vehicleActions';

export function ModelsClient() {
  return (
    <SubEntityPage
      title="Models"
      description="Vehicle models"
      addActionLabel="Add Model"
      listAction={listModels}
      createAction={(data) => createModel(data)}
      updateAction={(id, data) => updateModel(id, data)}
      deleteAction={deleteModel}
    />
  );
}
