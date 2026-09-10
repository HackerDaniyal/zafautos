import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockCmsRepo = {
  pages: {
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
  },
  sections: {
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
  },
  menuItems: {
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
  },
  versions: {
    create: vi.fn(),
    findById: vi.fn(),
  },
  listPages: vi.fn(),
  findBySlug: vi.fn(),
  findPublishedBySlug: vi.fn(),
  listSections: vi.fn(),
  listEnabledSections: vi.fn(),
  listAllMenus: vi.fn(),
  listMenusByLocation: vi.fn(),
  getMaxDisplayOrder: vi.fn(),
  getLatestVersionNumber: vi.fn(),
  listVersions: vi.fn(),
};

vi.mock('@/server/db/client', () => ({
  db: {},
}));

vi.mock('@/server/db/schema', () => ({
  homepageSections: {},
  menus: {},
}));

vi.mock('@/server/repositories/cmsRepository', () => ({
  CmsRepository: vi.fn().mockImplementation(function () {
    return mockCmsRepo;
  }),
}));

vi.mock('@/server/repositories/index', () => ({
  CmsRepository: vi.fn().mockImplementation(function () {
    return mockCmsRepo;
  }),
}));

vi.mock('@/server/repositories/newCmsRepository', () => ({
  newCmsRepository: {
    findBanners: vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } }),
    findBannerById: vi.fn(),
    findActiveBanners: vi.fn().mockResolvedValue([]),
    createBanner: vi.fn(),
    updateBanner: vi.fn(),
    softDeleteBanner: vi.fn(),
    findTestimonials: vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } }),
    findTestimonialById: vi.fn(),
    findPublishedTestimonials: vi.fn().mockResolvedValue([]),
    createTestimonial: vi.fn(),
    updateTestimonial: vi.fn(),
    softDeleteTestimonial: vi.fn(),
    findFaqs: vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } }),
    findFaqById: vi.fn(),
    findPublishedFaqs: vi.fn().mockResolvedValue([]),
    createFaq: vi.fn(),
    updateFaq: vi.fn(),
    softDeleteFaq: vi.fn(),
    findBlogPosts: vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } }),
    findBlogPostById: vi.fn(),
    findBlogPostBySlug: vi.fn(),
    findPublishedBlogPosts: vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } }),
    createBlogPost: vi.fn(),
    updateBlogPost: vi.fn(),
    softDeleteBlogPost: vi.fn(),
    findMediaUploads: vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } }),
    findMediaUploadById: vi.fn(),
    createMediaUpload: vi.fn(),
    updateMediaUpload: vi.fn(),
    softDeleteMediaUpload: vi.fn(),
    findHomepageSections: vi.fn().mockResolvedValue([]),
    findAllHomepageSections: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('@/server/services/errors', () => ({
  CmsPageNotFoundError: class extends Error {
    constructor(id: string) {
      super(`CMS page not found: ${id}`);
      this.name = 'CmsPageNotFoundError';
    }
  },
  CmsPageSlugConflictError: class extends Error {
    constructor(slug: string) {
      super(`Slug conflict: ${slug}`);
      this.name = 'CmsPageSlugConflictError';
    }
  },
  HomepageSectionNotFoundError: class extends Error {
    constructor(id: string) {
      super(`Section not found: ${id}`);
      this.name = 'HomepageSectionNotFoundError';
    }
  },
  MenuNotFoundError: class extends Error {
    constructor(id: string) {
      super(`Menu not found: ${id}`);
      this.name = 'MenuNotFoundError';
    }
  },
  ValidationError: class extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = 'ValidationError';
    }
  },
}));

describe('CMS - Page CRUD', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a new CMS page', async () => {
    mockCmsRepo.findBySlug.mockResolvedValue(null);
    mockCmsRepo.pages.create.mockResolvedValue({
      id: 'page-001', slug: 'about-us', title: 'About Us', status: 'draft',
    });

    const { CmsService } = await import('@/server/services/cmsService');
    const service = new CmsService();
    const result = await service.createPage({ slug: 'about-us', title: 'About Us', status: 'draft', robotsIndex: true, robotsFollow: true });

    expect(result).toBeDefined();
    expect(result.slug).toBe('about-us');
    expect(mockCmsRepo.pages.create).toHaveBeenCalled();
  });

  it('rejects duplicate slug', async () => {
    mockCmsRepo.findBySlug.mockResolvedValue({ id: 'existing', slug: 'about-us' });

    const { CmsService } = await import('@/server/services/cmsService');
    const service = new CmsService();

    await expect(service.createPage({ slug: 'about-us', title: 'About Us', status: 'draft', robotsIndex: true, robotsFollow: true })).rejects.toThrow('Slug conflict');
  });

  it('gets a page by id', async () => {
    mockCmsRepo.pages.findById.mockResolvedValue({ id: 'page-001', slug: 'about-us', title: 'About Us' });

    const { CmsService } = await import('@/server/services/cmsService');
    const service = new CmsService();
    const result = await service.getPage('page-001');

    expect(result.id).toBe('page-001');
  });

  it('throws for nonexistent page', async () => {
    mockCmsRepo.pages.findById.mockResolvedValue(null);

    const { CmsService } = await import('@/server/services/cmsService');
    const service = new CmsService();

    await expect(service.getPage('nonexistent')).rejects.toThrow('CMS page not found');
  });

  it('publishes a page', async () => {
    mockCmsRepo.pages.findById.mockResolvedValue({ id: 'page-001', slug: 'about-us', status: 'draft' });
    mockCmsRepo.findBySlug.mockResolvedValue(null);
    mockCmsRepo.pages.update.mockResolvedValue({ id: 'page-001', status: 'published' });

    const { CmsService } = await import('@/server/services/cmsService');
    const service = new CmsService();
    const result = await service.publishPage('page-001');

    expect(result).toBeDefined();
  });

  it('archives a page', async () => {
    mockCmsRepo.pages.findById.mockResolvedValue({ id: 'page-001', slug: 'about-us', status: 'published' });
    mockCmsRepo.findBySlug.mockResolvedValue(null);
    mockCmsRepo.pages.update.mockResolvedValue({ id: 'page-001', status: 'archived' });

    const { CmsService } = await import('@/server/services/cmsService');
    const service = new CmsService();
    const result = await service.archivePage('page-001');

    expect(result).toBeDefined();
  });

  it('soft deletes a page', async () => {
    mockCmsRepo.pages.findById.mockResolvedValue({ id: 'page-001', slug: 'test' });
    mockCmsRepo.pages.softDelete.mockResolvedValue({});

    const { CmsService } = await import('@/server/services/cmsService');
    const service = new CmsService();
    await service.deletePage('page-001');

    expect(mockCmsRepo.pages.softDelete).toHaveBeenCalledWith('page-001');
  });

  it('lists pages with pagination', async () => {
    mockCmsRepo.listPages.mockResolvedValue({
      data: [{ id: 'page-001', slug: 'about' }],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });

    const { CmsService } = await import('@/server/services/cmsService');
    const service = new CmsService();
    const result = await service.listPages({ page: 1, limit: 20 });

    expect(result.data).toHaveLength(1);
  });
});

describe('CMS - Homepage Sections', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a homepage section', async () => {
    mockCmsRepo.getMaxDisplayOrder.mockResolvedValue(3);
    mockCmsRepo.sections.create.mockResolvedValue({
      id: 'sec-001', type: 'hero', displayOrder: 4, isEnabled: true,
    });

    const { CmsService } = await import('@/server/services/cmsService');
    const service = new CmsService();
    const result = await service.createSection({ type: 'hero', isEnabled: true, displayOrder: 0 });

    expect(result).toBeDefined();
    expect(result.type).toBe('hero');
  });

  it('gets a section by id', async () => {
    mockCmsRepo.sections.findById.mockResolvedValue({ id: 'sec-001', type: 'hero' });

    const { CmsService } = await import('@/server/services/cmsService');
    const service = new CmsService();
    const result = await service.getSection('sec-001');

    expect(result.id).toBe('sec-001');
  });

  it('throws for nonexistent section', async () => {
    mockCmsRepo.sections.findById.mockResolvedValue(null);

    const { CmsService } = await import('@/server/services/cmsService');
    const service = new CmsService();

    await expect(service.getSection('nonexistent')).rejects.toThrow('Section not found');
  });

  it('updates a section', async () => {
    mockCmsRepo.sections.findById.mockResolvedValue({ id: 'sec-001', type: 'hero' });
    mockCmsRepo.sections.update.mockResolvedValue({ id: 'sec-001', title: 'Updated' });

    const { CmsService } = await import('@/server/services/cmsService');
    const service = new CmsService();
    const result = await service.updateSection('sec-001', { title: 'Updated' });

    expect(result).toBeDefined();
  });

  it('reorders sections', async () => {
    mockCmsRepo.sections.update.mockResolvedValue({});

    const { CmsService } = await import('@/server/services/cmsService');
    const service = new CmsService();
    await service.reorderSections(['sec-003', 'sec-001', 'sec-002']);

    expect(mockCmsRepo.sections.update).toHaveBeenCalledTimes(3);
  });

  it('soft deletes a section', async () => {
    mockCmsRepo.sections.findById.mockResolvedValue({ id: 'sec-001' });
    mockCmsRepo.sections.softDelete.mockResolvedValue({});

    const { CmsService } = await import('@/server/services/cmsService');
    const service = new CmsService();
    await service.deleteSection('sec-001');

    expect(mockCmsRepo.sections.softDelete).toHaveBeenCalledWith('sec-001');
  });
});

describe('CMS - Menu Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a menu item', async () => {
    mockCmsRepo.getMaxDisplayOrder.mockResolvedValue(2);
    mockCmsRepo.menuItems.create.mockResolvedValue({
      id: 'menu-001', location: 'header', label: 'Home', displayOrder: 3,
    });

    const { CmsService } = await import('@/server/services/cmsService');
    const service = new CmsService();
    const result = await service.createMenu({ location: 'header', label: 'Home', displayOrder: 0, isEnabled: true, openInNewTab: false });

    expect(result).toBeDefined();
    expect(result.label).toBe('Home');
  });

  it('lists menus by location', async () => {
    mockCmsRepo.listMenusByLocation.mockResolvedValue([
      { id: 'menu-001', label: 'Home', location: 'header' },
    ]);

    const { CmsService } = await import('@/server/services/cmsService');
    const service = new CmsService();
    const result = await service.listMenusByLocation('header');

    expect(result).toHaveLength(1);
  });

  it('throws for nonexistent menu', async () => {
    mockCmsRepo.menuItems.findById.mockResolvedValue(null);

    const { CmsService } = await import('@/server/services/cmsService');
    const service = new CmsService();

    await expect(service.getMenu('nonexistent')).rejects.toThrow('Menu not found');
  });
});

describe('CMS - Published/Draft/Archived States', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('page can go from draft to published', async () => {
    mockCmsRepo.pages.findById.mockResolvedValue({ id: 'page-001', slug: 'test', status: 'draft' });
    mockCmsRepo.findBySlug.mockResolvedValue(null);
    mockCmsRepo.pages.update.mockResolvedValue({ id: 'page-001', status: 'published' });

    const { CmsService } = await import('@/server/services/cmsService');
    const service = new CmsService();
    const result = await service.publishPage('page-001');

    expect(result).toBeDefined();
  });

  it('page can go from published to draft (unpublish)', async () => {
    mockCmsRepo.pages.findById.mockResolvedValue({ id: 'page-001', slug: 'test', status: 'published' });
    mockCmsRepo.findBySlug.mockResolvedValue(null);
    mockCmsRepo.pages.update.mockResolvedValue({ id: 'page-001', status: 'draft' });

    const { CmsService } = await import('@/server/services/cmsService');
    const service = new CmsService();
    const result = await service.unpublishPage('page-001');

    expect(result).toBeDefined();
  });

  it('page can go from published to archived', async () => {
    mockCmsRepo.pages.findById.mockResolvedValue({ id: 'page-001', slug: 'test', status: 'published' });
    mockCmsRepo.findBySlug.mockResolvedValue(null);
    mockCmsRepo.pages.update.mockResolvedValue({ id: 'page-001', status: 'archived' });

    const { CmsService } = await import('@/server/services/cmsService');
    const service = new CmsService();
    const result = await service.archivePage('page-001');

    expect(result).toBeDefined();
  });
});

describe('CMS - Blog Posts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a blog post', async () => {
    const { newCmsRepository } = await import('@/server/repositories/newCmsRepository');
    vi.mocked(newCmsRepository.findBlogPostBySlug).mockResolvedValue(null as any);
    vi.mocked(newCmsRepository.createBlogPost).mockResolvedValue({
      id: 'post-001', slug: 'my-first-post', title: 'My First Post', status: 'draft',
    } as any);

    const { CmsService } = await import('@/server/services/cmsService');
    const service = new CmsService();
    const result = await service.createBlogPost(
      { title: 'My First Post', content: 'Hello world', status: 'draft' },
      'user-001'
    );

    expect(result).toBeDefined();
    expect(newCmsRepository.createBlogPost).toHaveBeenCalled();
  });

  it('gets a blog post by id', async () => {
    const { newCmsRepository } = await import('@/server/repositories/newCmsRepository');
    vi.mocked(newCmsRepository.findBlogPostById).mockResolvedValue({
      id: 'post-001', title: 'Test Post',
    } as any);

    const { CmsService } = await import('@/server/services/cmsService');
    const service = new CmsService();
    const result = await service.getBlogPost('post-001');

    expect(result.id).toBe('post-001');
  });

  it('throws for nonexistent blog post', async () => {
    const { newCmsRepository } = await import('@/server/repositories/newCmsRepository');
    vi.mocked(newCmsRepository.findBlogPostById).mockResolvedValue(null as any);

    const { CmsService } = await import('@/server/services/cmsService');
    const service = new CmsService();

    await expect(service.getBlogPost('nonexistent')).rejects.toThrow('CMS page not found');
  });
});
