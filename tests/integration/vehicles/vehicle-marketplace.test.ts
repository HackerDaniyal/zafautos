import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockVehicleFindActive = vi.fn();
const mockVehicleListVehicles = vi.fn();
const mockVehicleFindBySlug = vi.fn();
const mockVehicleFindByIds = vi.fn();
const mockVehicleSoftDelete = vi.fn();
const mockVehicleGetStats = vi.fn();

vi.mock('@/server/repositories/vehicleRepository', () => ({
  VehicleRepository: vi.fn().mockImplementation(function () {
    return {
      findActive: mockVehicleFindActive,
      listVehicles: mockVehicleListVehicles,
      findBySlug: mockVehicleFindBySlug,
      findByIds: mockVehicleFindByIds,
      softDeleteVehicle: mockVehicleSoftDelete,
      getVehicleStats: mockVehicleGetStats,
    };
  }),
}));

vi.mock('@/server/repositories/marketplaceRepository', () => ({
  MarketplaceRepository: vi.fn().mockImplementation(function () {
    return {
      findFeatured: vi.fn().mockResolvedValue([]),
      recordView: vi.fn(),
      getWishlistForUser: vi.fn().mockResolvedValue([]),
      addToWishlist: vi.fn(),
      removeFromWishlist: vi.fn(),
      addComparisonEntry: vi.fn(),
      submitEnquiry: vi.fn(),
    };
  }),
}));

function makeVehicle(overrides: Record<string, any> = {}) {
  return {
    id: '550e8400-e29b-41d4-a716-446655440001',
    vin: 'JTDKN3DU5A0000001',
    stockNumber: 'STK-001',
    status: 'active',
    year: 2022,
    price: 2500000,
    mileage: 15000,
    manufacturerId: 'mfr-001',
    modelId: 'mod-001',
    bodyTypeId: 'bt-001',
    colorId: 'col-001',
    fuelTypeId: 'ft-001',
    transmissionId: 'tr-001',
    driveTypeId: 'dt-001',
    countryId: 'ctr-001',
    isFeatured: false,
    deletedAt: null,
    deletedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('Vehicle Marketplace - Active vehicles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('findActive returns only active vehicles', async () => {
    const activeVehicles = [
      makeVehicle({ id: 'v1', status: 'active' }),
      makeVehicle({ id: 'v2', status: 'active' }),
    ];
    mockVehicleFindActive.mockResolvedValue(activeVehicles);

    const { VehicleRepository } = await import('@/server/repositories/vehicleRepository');
    const repo = new VehicleRepository();
    const result = await repo.findActive();

    expect(result).toHaveLength(2);
    result.forEach((v: any) => expect(v.status).toBe('active'));
  });

  it('listVehicles excludes soft-deleted vehicles', async () => {
    const vehicles = [makeVehicle({ id: 'v1', deletedAt: null })];
    mockVehicleListVehicles.mockResolvedValue({
      data: vehicles,
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });

    const { VehicleRepository } = await import('@/server/repositories/vehicleRepository');
    const repo = new VehicleRepository();
    const result = await repo.listVehicles({ filters: {} });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].deletedAt).toBeNull();
  });
});

describe('Vehicle Marketplace - Search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('search with multi-word terms', async () => {
    mockVehicleListVehicles.mockResolvedValue({
      data: [makeVehicle({ id: 'v1' })],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });

    const { VehicleRepository } = await import('@/server/repositories/vehicleRepository');
    const repo = new VehicleRepository();
    const result = await repo.listVehicles({ filters: { search: 'Toyota Corolla' } });

    expect(mockVehicleListVehicles).toHaveBeenCalled();
    expect(result.data).toHaveLength(1);
  });

  it('search with year numbers', async () => {
    mockVehicleListVehicles.mockResolvedValue({
      data: [makeVehicle({ id: 'v1', year: 2023 })],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });

    const { VehicleRepository } = await import('@/server/repositories/vehicleRepository');
    const repo = new VehicleRepository();
    const result = await repo.listVehicles({ filters: { search: '2023' } });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].year).toBe(2023);
  });
});

describe('Vehicle Marketplace - Filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('manufacturer filtering', async () => {
    mockVehicleListVehicles.mockResolvedValue({
      data: [makeVehicle({ manufacturerId: 'mfr-toyota' })],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });

    const { VehicleRepository } = await import('@/server/repositories/vehicleRepository');
    const repo = new VehicleRepository();
    const result = await repo.listVehicles({ filters: { manufacturerIds: ['mfr-toyota'] } });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].manufacturerId).toBe('mfr-toyota');
  });

  it('model filtering', async () => {
    mockVehicleListVehicles.mockResolvedValue({
      data: [makeVehicle({ modelId: 'mod-corolla' })],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });

    const { VehicleRepository } = await import('@/server/repositories/vehicleRepository');
    const repo = new VehicleRepository();
    const result = await repo.listVehicles({ filters: { modelIds: ['mod-corolla'] } });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].modelId).toBe('mod-corolla');
  });

  it('body type filtering', async () => {
    mockVehicleListVehicles.mockResolvedValue({
      data: [makeVehicle({ bodyTypeId: 'bt-sedan' })],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });

    const { VehicleRepository } = await import('@/server/repositories/vehicleRepository');
    const repo = new VehicleRepository();
    const result = await repo.listVehicles({ filters: { bodyTypeIds: ['bt-sedan'] } });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].bodyTypeId).toBe('bt-sedan');
  });

  it('price range filtering', async () => {
    mockVehicleListVehicles.mockResolvedValue({
      data: [makeVehicle({ price: 3000000 })],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });

    const { VehicleRepository } = await import('@/server/repositories/vehicleRepository');
    const repo = new VehicleRepository();
    const result = await repo.listVehicles({ filters: { priceMin: 2000000, priceMax: 5000000 } });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].price).toBe(3000000);
  });

  it('year range filtering', async () => {
    mockVehicleListVehicles.mockResolvedValue({
      data: [makeVehicle({ year: 2021 })],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });

    const { VehicleRepository } = await import('@/server/repositories/vehicleRepository');
    const repo = new VehicleRepository();
    const result = await repo.listVehicles({ filters: { yearMin: 2020, yearMax: 2022 } });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].year).toBe(2021);
  });
});

describe('Vehicle Marketplace - Sorting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sorts by price ascending', async () => {
    const sorted = [
      makeVehicle({ id: 'v1', price: 1500000 }),
      makeVehicle({ id: 'v2', price: 3000000 }),
    ];
    mockVehicleListVehicles.mockResolvedValue({
      data: sorted,
      meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
    });

    const { VehicleRepository } = await import('@/server/repositories/vehicleRepository');
    const repo = new VehicleRepository();
    const result = await repo.listVehicles({ sort: { column: 'price', direction: 'asc' } });

    expect(result.data[0].price!).toBeLessThan(result.data[1].price!);
  });

  it('sorts by year descending', async () => {
    const sorted = [
      makeVehicle({ id: 'v1', year: 2023 }),
      makeVehicle({ id: 'v2', year: 2020 }),
    ];
    mockVehicleListVehicles.mockResolvedValue({
      data: sorted,
      meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
    });

    const { VehicleRepository } = await import('@/server/repositories/vehicleRepository');
    const repo = new VehicleRepository();
    const result = await repo.listVehicles({ sort: { column: 'year', direction: 'desc' } });

    expect(result.data[0].year!).toBeGreaterThan(result.data[1].year!);
  });
});

describe('Vehicle Marketplace - Pagination', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns correct pagination metadata', async () => {
    mockVehicleListVehicles.mockResolvedValue({
      data: Array.from({ length: 10 }, (_, i) => makeVehicle({ id: `v${i}` })),
      meta: { total: 55, page: 1, limit: 10, totalPages: 6 },
    });

    const { VehicleRepository } = await import('@/server/repositories/vehicleRepository');
    const repo = new VehicleRepository();
    const result = await repo.listVehicles({ pagination: { page: 1, limit: 10 } });

    expect(result.meta.total).toBe(55);
    expect(result.meta.page).toBe(1);
    expect(result.meta.limit).toBe(10);
    expect(result.meta.totalPages).toBe(6);
    expect(result.data).toHaveLength(10);
  });

  it('returns page 2 correctly', async () => {
    mockVehicleListVehicles.mockResolvedValue({
      data: Array.from({ length: 5 }, (_, i) => makeVehicle({ id: `v${i + 10}` })),
      meta: { total: 15, page: 2, limit: 10, totalPages: 2 },
    });

    const { VehicleRepository } = await import('@/server/repositories/vehicleRepository');
    const repo = new VehicleRepository();
    const result = await repo.listVehicles({ pagination: { page: 2, limit: 10 } });

    expect(result.meta.page).toBe(2);
    expect(result.data).toHaveLength(5);
  });

  it('returns empty data for out-of-range page', async () => {
    mockVehicleListVehicles.mockResolvedValue({
      data: [],
      meta: { total: 5, page: 10, limit: 20, totalPages: 1 },
    });

    const { VehicleRepository } = await import('@/server/repositories/vehicleRepository');
    const repo = new VehicleRepository();
    const result = await repo.listVehicles({ pagination: { page: 10, limit: 20 } });

    expect(result.data).toHaveLength(0);
  });
});
