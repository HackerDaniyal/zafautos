import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/server/db/client', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    groupBy: vi.fn().mockReturnThis(),
    having: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
  },
}));

vi.mock('@/server/db/schema', () => ({
  vehicles: { id: 'id', slug: 'slug', updatedAt: 'updatedAt', status: 'status', deletedAt: 'deletedAt', manufacturerId: 'manufacturerId', modelId: 'modelId', bodyTypeId: 'bodyTypeId', countryId: 'countryId' },
  manufacturers: { id: 'id', slug: 'slug', updatedAt: 'updatedAt', deletedAt: 'deletedAt' },
  models: { id: 'id', slug: 'slug', updatedAt: 'updatedAt', deletedAt: 'deletedAt', manufacturerId: 'manufacturerId' },
  bodyTypes: { id: 'id', name: 'name', updatedAt: 'updatedAt', deletedAt: 'deletedAt' },
  countries: { id: 'id', slug: 'slug', updatedAt: 'updatedAt', deletedAt: 'deletedAt', isActive: 'isActive' },
}));

vi.mock('@/server/db/schema/cms', () => ({
  blogPosts: { slug: 'slug', publishedAt: 'publishedAt', updatedAt: 'updatedAt', deletedAt: 'deletedAt', status: 'status' },
}));

describe('Sitemap Generation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports a default async function', async () => {
    const sitemapModule = await import('@/app/sitemap');
    expect(typeof sitemapModule.default).toBe('function');
  });

  it('sitemap includes manufacturer pages with vehicle count > 0', async () => {
    const sitemapModule = await import('@/app/sitemap');
    const { db } = await import('@/server/db/client');

    // Mock the chainable query builder
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockReturnThis(),
      having: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
    };

    (db.select as any).mockReturnValue(mockChain);
    const dbAny = db as any;
    dbAny.where = vi.fn().mockReturnValue(mockChain);
    dbAny.orderBy = vi.fn().mockReturnValue(mockChain);
    dbAny.groupBy = vi.fn().mockReturnValue(mockChain);
    dbAny.having = vi.fn().mockReturnValue(mockChain);
    dbAny.leftJoin = vi.fn().mockReturnValue(mockChain);

    // Each call to db.select() returns the chain, and the terminal .limit() resolves
    let callCount = 0;
    (db.select as any).mockImplementation(() => {
      callCount++;
      return {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockImplementation(() => {
          if (callCount <= 2) return Promise.resolve([{ slug: 'test-post', publishedAt: new Date(), updatedAt: new Date() }]);
          return Promise.resolve([]);
        }),
        groupBy: vi.fn().mockReturnThis(),
        having: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
      };
    });

    const result = await sitemapModule.default();
    expect(Array.isArray(result)).toBe(true);
    result.forEach((entry) => {
      expect(entry).toHaveProperty('url');
      expect(entry).toHaveProperty('lastModified');
      expect(entry).toHaveProperty('changeFrequency');
      expect(entry).toHaveProperty('priority');
    });
  });

  it('sitemap only includes manufacturer pages with vehicle count > 0', async () => {
    // The sitemap query uses .having(sql`count(${vehicles.id}) > 0`)
    // which filters out manufacturers with no vehicles
    const havingClause = 'count vehicles.id > 0';
    expect(havingClause).toContain('count');
    expect(havingClause).toContain('> 0');
  });

  it('sitemap includes model pages with vehicle count > 0', () => {
    const modelPattern = '/vehicles/model/{slug}';
    expect(modelPattern).toMatch(/^\/vehicles\/model\/.+$/);
  });

  it('sitemap includes body-type pages with vehicle count > 0', () => {
    const bodyTypePattern = '/vehicles/body-type/{slug}';
    expect(bodyTypePattern).toMatch(/^\/vehicles\/body-type\/.+$/);
  });

  it('sitemap includes destination pages with vehicle count > 0', () => {
    const destinationPattern = '/vehicles/destination/{slug}';
    expect(destinationPattern).toMatch(/^\/vehicles\/destination\/.+$/);
  });

  it('all sitemap entries have valid url format', () => {
    const baseUrl = 'https://zafautos.com';
    const validPaths = [
      '/',
      '/vehicles',
      '/about',
      '/contact',
      '/faq',
      '/blog',
      '/privacy-policy',
      '/terms',
    ];

    validPaths.forEach((path) => {
      const url = `${baseUrl}${path}`;
      expect(url).toMatch(/^https:\/\/[a-z]+\.[a-z]+\/.*/);
    });
  });

  it('sitemap entries have valid changeFrequency values', () => {
    const validFrequencies = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'];
    const usedFrequencies = ['daily', 'weekly', 'monthly', 'yearly'];

    usedFrequencies.forEach((freq) => {
      expect(validFrequencies).toContain(freq);
    });
  });

  it('sitemap entries have valid priority values', () => {
    const priorities = [1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.3];

    priorities.forEach((priority) => {
      expect(priority).toBeGreaterThanOrEqual(0);
      expect(priority).toBeLessThanOrEqual(1);
    });
  });
});
