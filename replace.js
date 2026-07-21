const fs = require('fs');
const files = [
  'RecentlyAddedVehicles.tsx',
  'NewArrivals.tsx',
  'BrowseByYear.tsx',
  'BrowseByTransmission.tsx',
  'BrowseByPrice.tsx',
  'BrowseByFuelType.tsx',
  'BrowseByCountry.tsx',
  'AuctionVehicles.tsx'
];

files.forEach(f => {
  const p = 'src/components/home/' + f;
  let c = fs.readFileSync(p, 'utf8');
  c = c.replace(
    "import { VehicleCard, placeholderVehicles } from '@/components/marketplace/VehicleCard';",
    "import { VehicleCard } from '@/components/marketplace/VehicleCard';\nimport { placeholderVehicles } from '@/data/placeholderVehicles';"
  );
  fs.writeFileSync(p, c);
});
console.log('done');
