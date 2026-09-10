'use client';

import { SubEntityPage } from '@/app/(admin)/admin/vehicles/components/sub-entity-page';
import { MakeLogo, BodyTypeIcon, FuelTypeIcon, ColorSwatch } from '@/components/admin/vehicles/entity-visuals';
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
        {
          key: 'logoUrl',
          label: 'Logo',
          type: 'image',
          autoBrandLogo: true,
          placeholder: 'Auto-fetched — paste a custom logo URL to override',
        },
      ]}
      namePreview={(name) => <MakeLogo name={name} className="h-10 w-auto" />}
      renderVisual={(item) => (
        <span className="flex size-8 items-center justify-center rounded-[6px] border border-iron/30 bg-deep-carbon p-1">
          <MakeLogo name={item.name} url={(item.logoUrl as string | null) || undefined} className="size-6" />
        </span>
      )}
      category="manufacturer"
      countAction={() => getVehicleLookupCounts('manufacturer')}
    />
  );
}