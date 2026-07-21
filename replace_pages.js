const fs = require('fs');
const files = [
  'app/(public)/wishlist/page.tsx',
  'app/(public)/vehicles/page.tsx',
  'app/(public)/vehicles/[slug]/page.tsx',
  'app/(public)/compare/page.tsx'
];

files.forEach(f => {
  const p = 'src/' + f;
  let c = fs.readFileSync(p, 'utf8');
  c = c.replace(
    "import { placeholderVehicles, VehicleCard, type VehicleCardData } from '@/components/marketplace/VehicleCard';",
    "import { VehicleCard, type VehicleCardData } from '@/components/marketplace/VehicleCard';\nimport { placeholderVehicles } from '@/data/placeholderVehicles';"
  );
  c = c.replace(
    "import { placeholderVehicles, type VehicleCardData } from '@/components/marketplace/VehicleCard';",
    "import { type VehicleCardData } from '@/components/marketplace/VehicleCard';\nimport { placeholderVehicles } from '@/data/placeholderVehicles';"
  );
  fs.writeFileSync(p, c);
});
console.log('done pages');
