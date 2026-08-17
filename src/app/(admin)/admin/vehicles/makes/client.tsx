'use client';

import { SubEntityPage } from '@/app/(admin)/admin/vehicles/components/sub-entity-page';
import {
  listManufacturers,
  createManufacturer,
  updateManufacturer,
  deleteManufacturer,
  getVehicleLookupCounts,
} from '@/server/actions/vehicleActions';
import { listActiveCountries } from '@/server/actions/countriesActions';

export function MakesClient() {
  return (
    <SubEntityPage
      title="Makes"
      description="Vehicle manufacturers"
      addActionLabel="Add Make"
      singular="make"
      listAction={listManufacturers}
      createAction={(data) => createManufacturer(data as { name: string; slug?: string; countryId?: string; logoUrl?: string })}
      updateAction={(id, data) => updateManufacturer(id, data as { name?: string; slug?: string; countryId?: string | null; logoUrl?: string | null })}
      deleteAction={deleteManufacturer}
      extraFields={[
        { key: 'countryId', label: 'Country', type: 'select', optionsAction: listActiveCountries },
        { key: 'logoUrl', label: 'Logo URL', type: 'url', placeholder: 'https://example.com/logo.png' },
      ]}
      category="manufacturer"
      countAction={() => getVehicleLookupCounts('manufacturer')}
      extraColumns={[
        {
          header: 'Country',
          render: (item, opts) => {
            const countryId = item.countryId as string | null;
            return (
              <span className="text-sm text-ash">
                {countryId ? (opts.countryId ?? []).find((o) => o.id === countryId)?.name ?? '—' : '—'}
              </span>
            );
          },
        },
      ]}
    />
  );
}
