import { CmsRepository } from '@/server/repositories';
import { homepageSections, menus } from '@/server/db/schema';
import { z } from 'zod';
import { CmsPageNotFoundError, CmsPageSlugConflictError, HomepageSectionNotFoundError, MenuNotFoundError, ValidationError } from './errors';

// ── Validation Schemas ────────────────────────────────────────────────────────

export const CreateCmsPageSchema = z.object({
  slug: z.string().min(1).max(255).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens'),
  title: z.string().min(1, 'Title is required').max(255),
  content: z.string().optional().nullable(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  featuredImageUrl: z.string().url().optional().nullable(),
  seoTitle: z.string().max(255).optional().nullable(),
  metaDescription: z.string().max(500).optional().nullable(),
  canonicalUrl: z.string().url().optional().nullable(),
  ogImage: z.string().url().optional().nullable(),
  robotsIndex: z.boolean().optional().default(true),
  robotsFollow: z.boolean().optional().default(true),
});
export type CreateCmsPageDTO = z.infer<typeof CreateCmsPageSchema>;

export const UpdateCmsPageSchema = CreateCmsPageSchema.partial();
export type UpdateCmsPageDTO = z.infer<typeof UpdateCmsPageSchema>;

export const CreateHomepageSectionSchema = z.object({
  type: z.enum([
    'hero', 'search', 'featured_vehicles', 'latest_vehicles',
    'browse_make', 'browse_body_type', 'browse_country', 'browse_continent',
    'why_choose_us', 'statistics', 'testimonials', 'faq', 'cta', 'footer',
  ]),
  isEnabled: z.boolean().optional().default(true),
  displayOrder: z.number().int().optional().default(0),
  title: z.string().max(255).optional().nullable(),
  subtitle: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  imageAlt: z.string().max(255).optional().nullable(),
  buttonLabel: z.string().max(100).optional().nullable(),
  buttonUrl: z.string().url().optional().nullable(),
  button2Label: z.string().max(100).optional().nullable(),
  button2Url: z.string().url().optional().nullable(),
  extraData: z.any().optional().nullable(),
});
export type CreateHomepageSectionDTO = z.infer<typeof CreateHomepageSectionSchema>;

export const UpdateHomepageSectionSchema = CreateHomepageSectionSchema.partial();
export type UpdateHomepageSectionDTO = z.infer<typeof UpdateHomepageSectionSchema>;

export const CreateMenuSchema = z.object({
  location: z.enum(['header', 'footer', 'mobile']),
  label: z.string().min(1, 'Label is required').max(100),
  url: z.string().max(500).optional().nullable(),
  pageSlug: z.string().max(255).optional().nullable(),
  externalUrl: z.string().url().optional().nullable(),
  openInNewTab: z.boolean().optional().default(false),
  isEnabled: z.boolean().optional().default(true),
  displayOrder: z.number().int().optional().default(0),
  parentId: z.string().uuid().optional().nullable(),
});
export type CreateMenuDTO = z.infer<typeof CreateMenuSchema>;

export const UpdateMenuSchema = CreateMenuSchema.partial();
export type UpdateMenuDTO = z.infer<typeof UpdateMenuSchema>;

// ── Service ───────────────────────────────────────────────────────────────────

export class CmsService {
  constructor(private readonly cmsRepo: CmsRepository = new CmsRepository()) {}

  // ── Pages ──────────────────────────────────────────────────────────────────

  async listPages(options: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  } = {}) {
    return this.cmsRepo.listPages({
      pagination: { page: options.page, limit: options.limit },
      search: options.search,
      status: options.status,
    });
  }

  async getPage(id: string) {
    const page = await this.cmsRepo.pages.findById(id) as any;
    if (!page) throw new CmsPageNotFoundError(id);
    return page;
  }

  async getPageBySlug(slug: string) {
    return this.cmsRepo.findPublishedBySlug(slug);
  }

  async createPage(data: CreateCmsPageDTO) {
    const validated = CreateCmsPageSchema.parse(data);
    const existing = await this.cmsRepo.findBySlug(validated.slug);
    if (existing) throw new CmsPageSlugConflictError(validated.slug);
    return this.cmsRepo.pages.create(validated as any);
  }

  async updatePage(id: string, data: UpdateCmsPageDTO) {
    const page = await this.cmsRepo.pages.findById(id) as any;
    if (!page) throw new CmsPageNotFoundError(id);

    const validated = UpdateCmsPageSchema.parse(data);

    if (validated.slug && validated.slug !== page.slug) {
      const existing = await this.cmsRepo.findBySlug(validated.slug);
      if (existing) throw new CmsPageSlugConflictError(validated.slug);
    }

    const updateData: Record<string, unknown> = { ...validated, updatedAt: new Date() };

    if (validated.status === 'published' && page.status !== 'published') {
      updateData.publishedAt = new Date();
    }

    return this.cmsRepo.pages.update(id, updateData as any);
  }

  async publishPage(id: string) {
    return this.updatePage(id, { status: 'published' });
  }

  async unpublishPage(id: string) {
    return this.updatePage(id, { status: 'draft' });
  }

  async archivePage(id: string) {
    return this.updatePage(id, { status: 'archived' });
  }

  async deletePage(id: string) {
    const page = await this.cmsRepo.pages.findById(id) as any;
    if (!page) throw new CmsPageNotFoundError(id);
    return this.cmsRepo.pages.softDelete(id);
  }

  async restorePage(id: string) {
    const page = await this.cmsRepo.pages.findById(id) as any;
    if (!page) throw new CmsPageNotFoundError(id);
    return this.cmsRepo.pages.update(id, { deletedAt: null, deletedBy: null } as any);
  }

  // ── Page Versions ──────────────────────────────────────────────────────────

  async listVersions(pageId: string) {
    const page = await this.cmsRepo.pages.findById(pageId) as any;
    if (!page) throw new CmsPageNotFoundError(pageId);
    return this.cmsRepo.listVersions(pageId);
  }

  async createVersion(pageId: string, userId?: string) {
    const page = await this.cmsRepo.pages.findById(pageId) as any;
    if (!page) throw new CmsPageNotFoundError(pageId);

    const nextVersion = (await this.cmsRepo.getLatestVersionNumber(pageId)) + 1;

    return this.cmsRepo.versions.create({
      pageId,
      content: page.content,
      title: page.title,
      status: page.status,
      seoTitle: page.seoTitle,
      metaDescription: page.metaDescription,
      versionNumber: nextVersion,
      createdBy: userId,
    } as any);
  }

  async restoreVersion(versionId: string, userId?: string) {
    const version = await this.cmsRepo.versions.findById(versionId) as any;
    if (!version) throw new ValidationError('Version not found');

    const page = await this.cmsRepo.pages.findById(version.pageId) as any;
    if (!page) throw new CmsPageNotFoundError(version.pageId);

    await this.createVersion(version.pageId, userId);

    return this.cmsRepo.pages.update(version.pageId, {
      content: version.content,
      title: version.title,
      seoTitle: version.seoTitle,
      metaDescription: version.metaDescription,
      updatedAt: new Date(),
      updatedBy: userId,
    } as any);
  }

  // ── Homepage Sections ──────────────────────────────────────────────────────

  async listSections() {
    return this.cmsRepo.listSections();
  }

  async listEnabledSections() {
    return this.cmsRepo.listEnabledSections();
  }

  async getSection(id: string) {
    const section = await this.cmsRepo.sections.findById(id) as any;
    if (!section) throw new HomepageSectionNotFoundError(id);
    return section;
  }

  async createSection(data: CreateHomepageSectionDTO) {
    const validated = CreateHomepageSectionSchema.parse(data);
    const maxOrder = await this.cmsRepo.getMaxDisplayOrder(homepageSections);
    return this.cmsRepo.sections.create({
      ...validated,
      displayOrder: validated.displayOrder ?? maxOrder + 1,
    } as any);
  }

  async updateSection(id: string, data: UpdateHomepageSectionDTO) {
    const section = await this.cmsRepo.sections.findById(id) as any;
    if (!section) throw new HomepageSectionNotFoundError(id);
    const validated = UpdateHomepageSectionSchema.parse(data);
    return this.cmsRepo.sections.update(id, { ...validated, updatedAt: new Date() } as any);
  }

  async deleteSection(id: string) {
    const section = await this.cmsRepo.sections.findById(id) as any;
    if (!section) throw new HomepageSectionNotFoundError(id);
    return this.cmsRepo.sections.softDelete(id);
  }

  async reorderSections(orderedIds: string[]) {
    for (let i = 0; i < orderedIds.length; i++) {
      await this.cmsRepo.sections.update(orderedIds[i], {
        displayOrder: i + 1,
        updatedAt: new Date(),
      } as any);
    }
  }

  // ── Menus ──────────────────────────────────────────────────────────────────

  async listMenus(location?: string) {
    return this.cmsRepo.listAllMenus(location);
  }

  async listMenusByLocation(location: string) {
    return this.cmsRepo.listMenusByLocation(location);
  }

  async getMenu(id: string) {
    const menu = await this.cmsRepo.menuItems.findById(id) as any;
    if (!menu) throw new MenuNotFoundError(id);
    return menu;
  }

  async createMenu(data: CreateMenuDTO) {
    const validated = CreateMenuSchema.parse(data);
    const maxOrder = await this.cmsRepo.getMaxDisplayOrder(menus);
    return this.cmsRepo.menuItems.create({
      ...validated,
      displayOrder: validated.displayOrder ?? maxOrder + 1,
    } as any);
  }

  async updateMenu(id: string, data: UpdateMenuDTO) {
    const menu = await this.cmsRepo.menuItems.findById(id) as any;
    if (!menu) throw new MenuNotFoundError(id);
    const validated = UpdateMenuSchema.parse(data);
    return this.cmsRepo.menuItems.update(id, { ...validated, updatedAt: new Date() } as any);
  }

  async deleteMenu(id: string) {
    const menu = await this.cmsRepo.menuItems.findById(id) as any;
    if (!menu) throw new MenuNotFoundError(id);
    return this.cmsRepo.menuItems.softDelete(id);
  }

  async reorderMenus(location: string, orderedIds: string[]) {
    for (let i = 0; i < orderedIds.length; i++) {
      const menu = await this.cmsRepo.menuItems.findById(orderedIds[i]) as any;
      if (menu && menu.location === location) {
        await this.cmsRepo.menuItems.update(orderedIds[i], {
          displayOrder: i + 1,
          updatedAt: new Date(),
        } as any);
      }
    }
  }
}
