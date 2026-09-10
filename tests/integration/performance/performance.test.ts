import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const SRC = path.resolve(__dirname, '../../../src');

function readFile(relPath: string): string {
  return fs.readFileSync(path.join(SRC, relPath), 'utf-8');
}

describe('Performance - Vehicle Listing Indexes', () => {
  it('vehicles table has status index', () => {
    const content = readFile('server/db/schema/vehicles.ts');
    expect(content).toMatch(/index\('vehicles_status_idx'\)/);
  });

  it('vehicles table has price index', () => {
    const content = readFile('server/db/schema/vehicles.ts');
    expect(content).toMatch(/index\('vehicles_price_idx'\)/);
  });

  it('vehicles table has year index', () => {
    const content = readFile('server/db/schema/vehicles.ts');
    expect(content).toMatch(/index\('vehicles_year_idx'\)/);
  });

  it('vehicles table has status+isFeatured composite index for homepage queries', () => {
    const content = readFile('server/db/schema/vehicles.ts');
    expect(content).toMatch(/index\('vehicles_status_featured_idx'\)/);
  });

  it('vehicles table has status+manufacturer+model composite index for filtered listings', () => {
    const content = readFile('server/db/schema/vehicles.ts');
    expect(content).toMatch(/index\('vehicles_status_manufacturer_model_idx'\)/);
  });

  it('vehicle_images has vehicle index for JOIN performance', () => {
    const content = readFile('server/db/schema/vehicles.ts');
    expect(content).toMatch(/index\('vehicle_images_vehicle_idx'\)/);
  });
});

describe('Performance - Homepage Parallel Queries', () => {
  it('getHomepageData uses Promise.all for parallel data fetching', () => {
    const content = readFile('lib/homepage-data.ts');
    expect(content).toContain('Promise.all');
  });

  it('Promise.all contains all homepage data queries', () => {
    const content = readFile('lib/homepage-data.ts');
    const promiseAllMatch = content.match(/Promise\.all\(\[([\s\S]*?)\]\)/);
    expect(promiseAllMatch).not.toBeNull();

    const queries = promiseAllMatch![1];
    expect(queries).toContain('fetchHomepageSections');
    expect(queries).toContain('fetchVehiclesWithImages');
    expect(queries).toContain('fetchHomepageCurrencies');
    expect(queries).toContain('fetchHomepageMakes');
    expect(queries).toContain('fetchHomepageContinents');
    expect(queries).toContain('fetchActiveBodyTypes');
    expect(queries).toContain('fetchActiveFuelTypes');
    expect(queries).toContain('fetchActiveTransmissions');
    expect(queries).toContain('fetchActiveDriveTypes');
    expect(queries).toContain('fetchActiveBanners');
    expect(queries).toContain('fetchPublishedTestimonials');
    expect(queries).toContain('fetchPublishedFaqs');
    expect(queries).toContain('fetchLatestBlogPosts');
  });

  it('queries are not awaited sequentially before Promise.all', () => {
    const content = readFile('lib/homepage-data.ts');
    const promiseAllIndex = content.indexOf('Promise.all');
    const linesBeforePromiseAll = content.substring(0, promiseAllIndex).split('\n');

    const awaitFnBeforePromiseAll = linesBeforePromiseAll.some((line) => {
      const trimmed = line.trim();
      return (
        trimmed.startsWith('const ') &&
        trimmed.includes('await fetch')
      );
    });

    expect(awaitFnBeforePromiseAll).toBe(false);
  });

  it('uses batch image fetching instead of per-vehicle queries', () => {
    const content = readFile('lib/homepage-data.ts');
    expect(content).toContain('inArray(vehicleImages.vehicleId, vehicleIds)');
  });
});

describe('Performance - N+1 Pattern Avoidance', () => {
  it('no sequential awaits inside for-of loops for DB queries in homepage-data', () => {
    const content = readFile('lib/homepage-data.ts');

    const forOfPattern = /for\s*\(.*\)\s*\{[^}]*await\s+db/g;
    const matches = content.match(forOfPattern);
    expect(matches).toBeNull();
  });

  it('no sequential awaits inside for-of loops in search suggestions', () => {
    const content = readFile('app/api/search/suggestions/route.ts');

    const forOfPattern = /for\s*\(.*\)\s*\{[^}]*await\s+db/g;
    const matches = content.match(forOfPattern);
    expect(matches).toBeNull();
  });

  it('search suggestions uses Promise.all for parallel queries', () => {
    const content = readFile('app/api/search/suggestions/route.ts');
    expect(content).toContain('Promise.all');
  });
});

describe('Performance - Search Autocomplete Debounce', () => {
  it('SearchBar component has debounce timer (setTimeout with 300ms)', () => {
    const content = readFile('components/marketplace/SearchBar.tsx');
    expect(content).toContain('setTimeout');
    expect(content).toContain('300');
  });

  it('SearchBar cancels pending fetch requests with AbortController', () => {
    const content = readFile('components/marketplace/SearchBar.tsx');
    expect(content).toContain('AbortController');
    expect(content).toContain('abortRef');
  });

  it('SearchBar cleans up debounce timer on unmount', () => {
    const content = readFile('components/marketplace/SearchBar.tsx');
    expect(content).toContain('clearTimeout');
  });
});

describe('Performance - Image Optimization', () => {
  it('no "unoptimized" prop on Next.js Image components in src', () => {
    function findFiles(dir: string): string[] {
      const results: string[] = [];
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory() && item.name !== 'node_modules') {
          results.push(...findFiles(fullPath));
        } else if (item.isFile() && item.name.endsWith('.tsx')) {
          results.push(fullPath);
        }
      }
      return results;
    }

    const tsxFiles = findFiles(path.join(SRC, 'components'));
    for (const file of tsxFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      expect(content).not.toMatch(/unoptimized\s*(=\s*\{?\s*true)?/);
    }
  });
});
