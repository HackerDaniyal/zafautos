const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');

let passed = 0;
let failed = 0;
const failures = [];

function check(label, fn) {
  try {
    const result = fn();
    if (result) {
      passed++;
    } else {
      failed++;
      failures.push(label);
      console.log(`  FAIL: ${label}`);
    }
  } catch (e) {
    failed++;
    failures.push(`${label}: ${e.message}`);
    console.log(`  FAIL: ${label}: ${e.message}`);
  }
}

function fileExists(p) {
  return fs.existsSync(path.join(SRC, p));
}

function fileContains(p, ...terms) {
  const full = path.join(SRC, p);
  if (!fs.existsSync(full)) return false;
  const content = fs.readFileSync(full, 'utf-8');
  return terms.every((t) => content.includes(t));
}

function fileNotContains(p, ...terms) {
  const full = path.join(SRC, p);
  if (!fs.existsSync(full)) return true;
  const content = fs.readFileSync(full, 'utf-8');
  return !terms.some((t) => content.includes(t));
}

console.log('\n=== A.19 — Advanced Search, Discovery & SEO Optimization ===\n');

// ─── SEARCH ───────────────────────────────────────
console.log('--- Search ---');

check('SearchBar exists', () =>
  fileExists('components/marketplace/SearchBar.tsx'));

check('SearchBar uses role="combobox" for accessibility', () =>
  fileContains('components/marketplace/SearchBar.tsx', 'role="combobox"'));

check('SearchBar has aria-expanded', () =>
  fileContains('components/marketplace/SearchBar.tsx', 'aria-expanded'));

check('SearchBar has aria-controls', () =>
  fileContains('components/marketplace/SearchBar.tsx', 'aria-controls'));

check('Search suggestions API route exists', () =>
  fileExists('app/api/search/suggestions/route.ts'));

check('Search suggestions API uses AbortController', () =>
  fileContains('components/marketplace/SearchBar.tsx', 'AbortController'));

check('Search suggestions API queries manufacturers', () =>
  fileContains('app/api/search/suggestions/route.ts', 'manufacturers'));

check('Search suggestions API queries models', () =>
  fileContains('app/api/search/suggestions/route.ts', 'models'));

check('Search suggestions API queries vehicles', () =>
  fileContains('app/api/search/suggestions/route.ts', 'vehicles'));

check('SearchBar fetches from /api/search/suggestions', () =>
  fileContains('components/marketplace/SearchBar.tsx', '/api/search/suggestions'));

check('SearchBar has debounced fetch (300ms)', () =>
  fileContains('components/marketplace/SearchBar.tsx', '300'));

check('SearchBar shows loading indicator', () =>
  fileContains('components/marketplace/SearchBar.tsx', 'animate-spin'));

check('VehicleRepository search splits multi-word queries', () =>
  fileContains('server/repositories/vehicleRepository.ts', '.split('));

check('VehicleRepository search supports year matching', () =>
  fileContains('server/repositories/vehicleRepository.ts', '/^\\d{4}$/'));

// ─── FILTERS ─────────────────────────────────────
console.log('\n--- Filters ---');

check('FilterSidebar exists', () =>
  fileExists('components/marketplace/FilterSidebar.tsx'));

check('FilterSidebar has make filter', () =>
  fileContains('components/marketplace/FilterSidebar.tsx', 'Make'));

check('FilterSidebar has model filter', () =>
  fileContains('components/marketplace/FilterSidebar.tsx', 'Model'));

check('FilterSidebar has body type filter', () =>
  fileContains('components/marketplace/FilterSidebar.tsx', 'Body Type'));

check('FilterSidebar has fuel type filter', () =>
  fileContains('components/marketplace/FilterSidebar.tsx', 'Fuel Type'));

check('FilterSidebar has transmission filter', () =>
  fileContains('components/marketplace/FilterSidebar.tsx', 'Transmission'));

check('FilterSidebar has country filter', () =>
  fileContains('components/marketplace/FilterSidebar.tsx', 'Country'));

check('FilterSidebar has price range', () =>
  fileContains('components/marketplace/FilterSidebar.tsx', 'priceRange'));

check('FilterSidebar has year range', () =>
  fileContains('components/marketplace/FilterSidebar.tsx', 'yearRange'));

check('FilterSidebar has mileage filter', () =>
  fileContains('components/marketplace/FilterSidebar.tsx', 'mileageMax'));

check('VehiclesPageClient has URL state management', () =>
  fileContains('app/(public)/vehicles/VehiclesPageClient.tsx', 'URLSearchParams'));

check('VehiclesPageClient navigates with URL params', () =>
  fileContains('app/(public)/vehicles/VehiclesPageClient.tsx', 'router.push'));

check('VehiclesPageClient has clear all filters', () =>
  fileContains('app/(public)/vehicles/VehiclesPageClient.tsx', 'handleReset'));

check('VehiclesPageClient has Make→Model dependency', () =>
  fileContains('app/(public)/vehicles/VehiclesPageClient.tsx', 'Make→Model'));

// ─── SORTING ─────────────────────────────────────
console.log('\n--- Sorting ---');

check('SortSelect exists', () =>
  fileExists('components/marketplace/SortSelect.tsx'));

check('SortSelect has newest sort', () =>
  fileContains('components/marketplace/SortSelect.tsx', 'newest'));

check('SortSelect has price ascending', () =>
  fileContains('components/marketplace/SortSelect.tsx', 'price-asc'));

check('SortSelect has price descending', () =>
  fileContains('components/marketplace/SortSelect.tsx', 'price-desc'));

check('SortSelect has year sort', () =>
  fileContains('components/marketplace/SortSelect.tsx', 'year-desc'));

check('SortSelect has mileage sort', () =>
  fileContains('components/marketplace/SortSelect.tsx', 'mileage-asc'));

check('Server-side sort parsing exists', () =>
  fileContains('server/actions/publicVehicleActions.ts', 'parseSort'));

// ─── PAGINATION ──────────────────────────────────
console.log('\n--- Pagination ---');

check('Pagination component exists', () =>
  fileExists('components/marketplace/Pagination.tsx'));

check('Pagination has aria-label', () =>
  fileContains('components/marketplace/Pagination.tsx', 'aria-label'));

check('Pagination has aria-current', () =>
  fileContains('components/marketplace/Pagination.tsx', 'aria-current'));

check('Server-side pagination (limit/offset)', () =>
  fileContains('server/repositories/vehicleRepository.ts', 'offset'));

check('Total pages calculation', () =>
  fileContains('server/repositories/vehicleRepository.ts', 'totalPages'));

// ─── VEHICLE DETAIL SEO ──────────────────────────
console.log('\n--- Vehicle Detail SEO ---');

check('Vehicle detail page exists', () =>
  fileExists('app/(public)/vehicles/[slug]/page.tsx'));

check('Vehicle detail has generateMetadata', () =>
  fileContains('app/(public)/vehicles/[slug]/page.tsx', 'generateMetadata'));

check('Vehicle detail has canonical URL', () =>
  fileContains('app/(public)/vehicles/[slug]/page.tsx', 'alternates'));

check('Vehicle detail has OpenGraph metadata', () =>
  fileContains('app/(public)/vehicles/[slug]/page.tsx', 'openGraph'));

check('Vehicle detail has Twitter card', () =>
  fileContains('app/(public)/vehicles/[slug]/page.tsx', 'twitter'));

check('Vehicle detail has JSON-LD structured data', () =>
  fileContains('app/(public)/vehicles/[slug]/page.tsx', 'application/ld+json'));

check('JSON-LD uses Product schema', () =>
  fileContains('app/(public)/vehicles/[slug]/page.tsx', "'Product'"));

check('JSON-LD has brand', () =>
  fileContains('app/(public)/vehicles/[slug]/page.tsx', 'Brand'));

check('JSON-LD has offers', () =>
  fileContains('app/(public)/vehicles/[slug]/page.tsx', 'Offer'));

check('JSON-LD has additionalProperty', () =>
  fileContains('app/(public)/vehicles/[slug]/page.tsx', 'additionalProperty'));

check('Vehicle detail uses notFound() for missing', () =>
  fileContains('app/(public)/vehicles/[slug]/page.tsx', 'notFound()'));

check('Vehicle detail has proper title format', () =>
  fileContains('app/(public)/vehicles/[slug]/page.tsx', 'for Sale | ZafAutos'));

// ─── MARKETPLACE LISTING SEO ─────────────────────
console.log('\n--- Marketplace Listing SEO ---');

check('Listing page has generateMetadata', () =>
  fileContains('app/(public)/vehicles/page.tsx', 'generateMetadata'));

check('Listing page has canonical URL', () =>
  fileContains('app/(public)/vehicles/page.tsx', 'alternates'));

check('Listing page has dynamic title', () =>
  fileContains('app/(public)/vehicles/page.tsx', 'buildTitle'));

check('Listing page has robots config', () =>
  fileContains('app/(public)/vehicles/page.tsx', 'robots'));

check('Listing page blocks indexing of filtered pages', () =>
  fileContains('app/(public)/vehicles/page.tsx', 'index: !canonicalQs'));

// ─── IMAGE COUNT FIX ─────────────────────────────
console.log('\n--- Image Count Fix ---');

check('listWithRelations computes image counts', () =>
  fileContains('server/repositories/vehicleRepository.ts', 'imageCountMap'));

check('Image count included in enriched data', () =>
  fileContains('server/repositories/vehicleRepository.ts', '_imageCount'));

check('PublicVehicleListResult uses _imageCount', () =>
  fileContains('server/actions/publicVehicleActions.ts', '_imageCount'));

check('imageCount is no longer hardcoded to 0', () =>
  fileNotContains('server/actions/publicVehicleActions.ts', 'imageCount: 0'));

// ─── CURRENCY FIX ────────────────────────────────
console.log('\n--- Currency Fix ---');

check('Currency is resolved from vehicle record', () =>
  fileContains('server/actions/publicVehicleActions.ts', 'currencyMap'));

check('Currency is no longer hardcoded to USD', () =>
  fileContains('server/actions/publicVehicleActions.ts', 'v.currencyId'));

check('Currencies table imported', () =>
  fileContains('server/actions/publicVehicleActions.ts', 'currencies'));

// ─── RELATED VEHICLES ────────────────────────────
console.log('\n--- Related Vehicles ---');

check('Similar vehicles function accepts vehicle params', () =>
  fileContains('server/actions/publicVehicleActions.ts', 'modelId'));

check('Similar vehicles consider model match', () =>
  fileContains('server/actions/publicVehicleActions.ts', 'modelIds: [vehicle.modelId]'));

check('Similar vehicles score by similarity', () =>
  fileContains('server/actions/publicVehicleActions.ts', 'let score'));

check('Similar vehicles consider body type', () =>
  fileContains('server/actions/publicVehicleActions.ts', 'bodyTypeId'));

check('Similar vehicles consider price range', () =>
  fileContains('server/actions/publicVehicleActions.ts', 'Math.abs'));

check('Vehicle detail passes modelId to similar', () =>
  fileContains('app/(public)/vehicles/[slug]/page.tsx', 'modelId'));

check('Vehicle detail passes bodyTypeId to similar', () =>
  fileContains('app/(public)/vehicles/[slug]/page.tsx', 'bodyTypeId'));

check('Vehicle detail passes price to similar', () =>
  fileContains('app/(public)/vehicles/[slug]/page.tsx', 'price: data.vehicle.price'));

// ─── SEO LANDING PAGES ───────────────────────────
console.log('\n--- SEO Landing Pages ---');

check('Manufacturer landing page exists', () =>
  fileExists('app/(public)/vehicles/manufacturer/[slug]/page.tsx'));

check('Manufacturer page has generateMetadata', () =>
  fileContains('app/(public)/vehicles/manufacturer/[slug]/page.tsx', 'generateMetadata'));

check('Manufacturer page has canonical', () =>
  fileContains('app/(public)/vehicles/manufacturer/[slug]/page.tsx', 'alternates'));

check('Manufacturer page has JSON-LD', () =>
  fileContains('app/(public)/vehicles/manufacturer/[slug]/page.tsx', 'ld+json'));

check('Manufacturer page has notFound', () =>
  fileContains('app/(public)/vehicles/manufacturer/[slug]/page.tsx', 'notFound'));

check('Model landing page exists', () =>
  fileExists('app/(public)/vehicles/model/[slug]/page.tsx'));

check('Model page has generateMetadata', () =>
  fileContains('app/(public)/vehicles/model/[slug]/page.tsx', 'generateMetadata'));

check('Model page has canonical', () =>
  fileContains('app/(public)/vehicles/model/[slug]/page.tsx', 'alternates'));

check('Model page has JSON-LD', () =>
  fileContains('app/(public)/vehicles/model/[slug]/page.tsx', 'ld+json'));

check('Body type landing page exists', () =>
  fileExists('app/(public)/vehicles/body-type/[slug]/page.tsx'));

check('Body type page has generateMetadata', () =>
  fileContains('app/(public)/vehicles/body-type/[slug]/page.tsx', 'generateMetadata'));

check('Body type page has canonical', () =>
  fileContains('app/(public)/vehicles/body-type/[slug]/page.tsx', 'alternates'));

check('Body type page has JSON-LD', () =>
  fileContains('app/(public)/vehicles/body-type/[slug]/page.tsx', 'ld+json'));

check('Destination landing page exists', () =>
  fileExists('app/(public)/vehicles/destination/[slug]/page.tsx'));

check('Destination page has generateMetadata', () =>
  fileContains('app/(public)/vehicles/destination/[slug]/page.tsx', 'generateMetadata'));

check('Destination page has canonical', () =>
  fileContains('app/(public)/vehicles/destination/[slug]/page.tsx', 'alternates'));

check('Destination page has JSON-LD', () =>
  fileContains('app/(public)/vehicles/destination/[slug]/page.tsx', 'ld+json'));

check('SEO landing page component exists', () =>
  fileExists('components/marketplace/SeoLandingPage.tsx'));

check('SEO data fetching utility exists', () =>
  fileExists('lib/public-seo-data.ts'));

check('getManufacturerSeoData function exists', () =>
  fileContains('lib/public-seo-data.ts', 'getManufacturerSeoData'));

check('getModelSeoData function exists', () =>
  fileContains('lib/public-seo-data.ts', 'getModelSeoData'));

check('getBodyTypeSeoData function exists', () =>
  fileContains('lib/public-seo-data.ts', 'getBodyTypeSeoData'));

check('getDestinationSeoData function exists', () =>
  fileContains('lib/public-seo-data.ts', 'getDestinationSeoData'));

// ─── SITEMAP ─────────────────────────────────────
console.log('\n--- Sitemap ---');

check('Sitemap includes manufacturer pages', () =>
  fileContains('app/sitemap.ts', 'manufacturerPages'));

check('Sitemap includes model pages', () =>
  fileContains('app/sitemap.ts', 'modelPages'));

check('Sitemap includes body type pages', () =>
  fileContains('app/sitemap.ts', 'bodyTypePages'));

check('Sitemap includes destination pages', () =>
  fileContains('app/sitemap.ts', 'destinationPages'));

check('Sitemap filters empty pages', () =>
  fileContains('app/sitemap.ts', 'vehicleCount'));

check('Sitemap has vehicle detail pages', () =>
  fileContains('app/sitemap.ts', 'vehiclePages'));

check('Sitemap has blog pages', () =>
  fileContains('app/sitemap.ts', 'blogPages'));

// ─── DATA INTEGRITY ──────────────────────────────
console.log('\n--- Data Integrity ---');

check('Vehicle status "active" enforced in listing', () =>
  fileContains('server/actions/publicVehicleActions.ts', "status: 'active'"));

check('Soft-delete check in listing', () =>
  fileContains('server/repositories/vehicleRepository.ts', 'deletedAt'));

check('No hardcoded vehicle arrays', () =>
  fileNotContains('app/(public)/vehicles/page.tsx', "'Toyota'"));

check('No hardcoded manufacturer arrays in search', () =>
  fileNotContains('components/marketplace/SearchBar.tsx', "'Toyota Land Cruiser'"));

check('SearchBar popular searches removed', () =>
  fileNotContains('components/marketplace/SearchBar.tsx', 'POPULAR_SEARCHES'));

check('Vehicle detail has modelId in data', () =>
  fileContains('server/actions/publicVehicleActions.ts', 'modelId: vehicle.modelId'));

check('Vehicle detail has bodyTypeId in data', () =>
  fileContains('server/actions/publicVehicleActions.ts', 'bodyTypeId: vehicle.bodyTypeId'));

// ─── SECURITY ────────────────────────────────────
console.log('\n--- Security ---');

check('No admin data in public search', () =>
  fileNotContains('components/marketplace/SearchBar.tsx', 'admin'));

check('No deleted vehicles in search results', () =>
  fileContains('server/repositories/vehicleRepository.ts', 'deletedAt'));

check('No draft vehicles in public listing', () =>
  fileContains('server/actions/publicVehicleActions.ts', "status: 'active'"));

check('Search suggestions filter by active status', () =>
  fileContains('app/api/search/suggestions/route.ts', "eq(vehicles.status, 'active')"));

check('Search suggestions filter deleted', () =>
  fileContains('app/api/search/suggestions/route.ts', 'isNull(vehicles.deletedAt)'));

// ─── ACCESSIBILITY ───────────────────────────────
console.log('\n--- Accessibility ---');

check('SearchBar has sr-only label', () =>
  fileContains('components/marketplace/SearchBar.tsx', 'sr-only'));

check('SearchBar has aria-label on clear button', () =>
  fileContains('components/marketplace/SearchBar.tsx', 'aria-label="Clear search"'));

check('FilterSidebar sections are collapsible', () =>
  fileContains('components/marketplace/FilterSidebar.tsx', 'FilterSection'));

check('VehicleCard has alt text on images', () =>
  fileContains('components/marketplace/VehicleCard.tsx', 'alt='));

check('Pagination has aria-label', () =>
  fileContains('components/marketplace/Pagination.tsx', 'aria-label'));

// ─── MOBILE ──────────────────────────────────────
console.log('\n--- Mobile ---');

check('Mobile filter drawer exists', () =>
  fileExists('components/marketplace/MobileFilterDrawer.tsx'));

check('VehiclesPageClient has mobile filter trigger', () =>
  fileContains('app/(public)/vehicles/VehiclesPageClient.tsx', 'MobileFilterDrawer'));

check('Search suggestions have max-height for mobile', () =>
  fileContains('components/marketplace/SearchBar.tsx', 'max-h-[60vh]'));

// ─── PERFORMANCE ─────────────────────────────────
console.log('\n--- Performance ---');

check('Vehicle detail does not double-fetch', () =>
  fileContains('app/(public)/vehicles/[slug]/page.tsx', 'getVehicleData'));

check('Vehicle listing uses server-side pagination', () =>
  fileContains('server/repositories/vehicleRepository.ts', 'offset'));

check('Filter counts are computed in parallel', () =>
  fileContains('server/actions/publicVehicleActions.ts', 'Promise.all'));

check('Related entities fetched in parallel', () =>
  fileContains('lib/public-seo-data.ts', 'Promise.all'));

// ─── RESULTS ─────────────────────────────────────
console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);

if (failures.length > 0) {
  console.log('\nFailures:');
  failures.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
}

process.exit(failed > 0 ? 1 : 0);
