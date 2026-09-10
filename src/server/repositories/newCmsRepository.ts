import { eq, and, desc, asc, sql, count, ilike, or, gte, lte, isNull } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { banners, testimonials, faqs, blogPosts, mediaUploads, homepageSections } from '@/server/db/schema/cms';

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface CmsPaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class NewCmsRepository {
  // ── Banners ────────────────────────────────────────────────────────────────

  async findBanners(params: PaginationParams = {}): Promise<CmsPaginatedResult<typeof banners.$inferSelect>> {
    const { page = 1, limit = 10, search } = params;
    const offset = (page - 1) * limit;
    const conditions = [isNull(banners.deletedAt)];
    if (search) {
      conditions.push(or(ilike(banners.title, `%${search}%`), ilike(banners.placement, `%${search}%`))!);
    }
    const where = and(...conditions);
    const [items, totalResult] = await Promise.all([
      db.select().from(banners).where(where).orderBy(asc(banners.displayOrder)).limit(limit).offset(offset),
      db.select({ count: count() }).from(banners).where(where),
    ]);
    return { items, total: totalResult[0].count, page, limit, totalPages: Math.ceil(totalResult[0].count / limit) };
  }

  async findActiveBanners(placement?: string) {
    const conditions = [isNull(banners.deletedAt), eq(banners.isActive, true), or(isNull(banners.startDate), lte(banners.startDate, new Date()))!, or(isNull(banners.endDate), gte(banners.endDate, new Date()))!];
    if (placement) conditions.push(eq(banners.placement, placement));
    return db.select().from(banners).where(and(...conditions)).orderBy(asc(banners.displayOrder));
  }

  async findBannerById(id: string) {
    const [result] = await db.select().from(banners).where(and(eq(banners.id, id), isNull(banners.deletedAt)));
    return result;
  }

  async createBanner(data: typeof banners.$inferInsert) {
    const [result] = await db.insert(banners).values(data).returning();
    return result;
  }

  async updateBanner(id: string, data: Partial<typeof banners.$inferInsert>) {
    const [result] = await db.update(banners).set({ ...data, updatedAt: new Date() }).where(eq(banners.id, id)).returning();
    return result;
  }

  async softDeleteBanner(id: string, deletedBy: string) {
    await db.update(banners).set({ deletedAt: new Date(), deletedBy, updatedAt: new Date() }).where(eq(banners.id, id));
  }

  async countBanners() {
    const [result] = await db.select({ count: count() }).from(banners).where(isNull(banners.deletedAt));
    return result.count;
  }

  // ── Testimonials ───────────────────────────────────────────────────────────

  async findTestimonials(params: PaginationParams = {}): Promise<CmsPaginatedResult<typeof testimonials.$inferSelect>> {
    const { page = 1, limit = 10, search } = params;
    const offset = (page - 1) * limit;
    const conditions = [isNull(testimonials.deletedAt)];
    if (search) {
      conditions.push(or(ilike(testimonials.customerName, `%${search}%`), ilike(testimonials.quote, `%${search}%`))!);
    }
    const where = and(...conditions);
    const [items, totalResult] = await Promise.all([
      db.select().from(testimonials).where(where).orderBy(asc(testimonials.displayOrder)).limit(limit).offset(offset),
      db.select({ count: count() }).from(testimonials).where(where),
    ]);
    return { items, total: totalResult[0].count, page, limit, totalPages: Math.ceil(totalResult[0].count / limit) };
  }

  async findPublishedTestimonials() {
    return db.select().from(testimonials).where(and(isNull(testimonials.deletedAt), eq(testimonials.isPublished, true))).orderBy(asc(testimonials.displayOrder));
  }

  async findTestimonialById(id: string) {
    const [result] = await db.select().from(testimonials).where(and(eq(testimonials.id, id), isNull(testimonials.deletedAt)));
    return result;
  }

  async createTestimonial(data: typeof testimonials.$inferInsert) {
    const [result] = await db.insert(testimonials).values(data).returning();
    return result;
  }

  async updateTestimonial(id: string, data: Partial<typeof testimonials.$inferInsert>) {
    const [result] = await db.update(testimonials).set({ ...data, updatedAt: new Date() }).where(eq(testimonials.id, id)).returning();
    return result;
  }

  async softDeleteTestimonial(id: string, deletedBy: string) {
    await db.update(testimonials).set({ deletedAt: new Date(), deletedBy, updatedAt: new Date() }).where(eq(testimonials.id, id));
  }

  async countTestimonials() {
    const [result] = await db.select({ count: count() }).from(testimonials).where(isNull(testimonials.deletedAt));
    return result.count;
  }

  // ── FAQs ───────────────────────────────────────────────────────────────────

  async findFaqs(params: PaginationParams = {}): Promise<CmsPaginatedResult<typeof faqs.$inferSelect>> {
    const { page = 1, limit = 10, search } = params;
    const offset = (page - 1) * limit;
    const conditions = [isNull(faqs.deletedAt)];
    if (search) {
      conditions.push(or(ilike(faqs.question, `%${search}%`), ilike(faqs.answer, `%${search}%`))!);
    }
    const where = and(...conditions);
    const [items, totalResult] = await Promise.all([
      db.select().from(faqs).where(where).orderBy(asc(faqs.displayOrder)).limit(limit).offset(offset),
      db.select({ count: count() }).from(faqs).where(where),
    ]);
    return { items, total: totalResult[0].count, page, limit, totalPages: Math.ceil(totalResult[0].count / limit) };
  }

  async findPublishedFaqs() {
    return db.select().from(faqs).where(and(isNull(faqs.deletedAt), eq(faqs.isPublished, true))).orderBy(asc(faqs.displayOrder));
  }

  async findFaqsByCategory(category: string) {
    return db.select().from(faqs).where(and(isNull(faqs.deletedAt), eq(faqs.isPublished, true), eq(faqs.category, category))).orderBy(asc(faqs.displayOrder));
  }

  async findFaqById(id: string) {
    const [result] = await db.select().from(faqs).where(and(eq(faqs.id, id), isNull(faqs.deletedAt)));
    return result;
  }

  async createFaq(data: typeof faqs.$inferInsert) {
    const [result] = await db.insert(faqs).values(data).returning();
    return result;
  }

  async updateFaq(id: string, data: Partial<typeof faqs.$inferInsert>) {
    const [result] = await db.update(faqs).set({ ...data, updatedAt: new Date() }).where(eq(faqs.id, id)).returning();
    return result;
  }

  async softDeleteFaq(id: string, deletedBy: string) {
    await db.update(faqs).set({ deletedAt: new Date(), deletedBy, updatedAt: new Date() }).where(eq(faqs.id, id));
  }

  async countFaqs() {
    const [result] = await db.select({ count: count() }).from(faqs).where(isNull(faqs.deletedAt));
    return result.count;
  }

  async getFaqCategories() {
    const result = await db.execute(sql`SELECT DISTINCT category FROM faqs WHERE deleted_at IS NULL AND is_published = true ORDER BY category`);
    return (result as any).rows?.map((r: any) => r.category) || [];
  }

  // ── Blog Posts ─────────────────────────────────────────────────────────────

  async findBlogPosts(params: PaginationParams = {}): Promise<CmsPaginatedResult<typeof blogPosts.$inferSelect>> {
    const { page = 1, limit = 10, search } = params;
    const offset = (page - 1) * limit;
    const conditions = [isNull(blogPosts.deletedAt)];
    if (search) {
      conditions.push(or(ilike(blogPosts.title, `%${search}%`), ilike(blogPosts.excerpt, `%${search}%`))!);
    }
    const where = and(...conditions);
    const [items, totalResult] = await Promise.all([
      db.select().from(blogPosts).where(where).orderBy(desc(blogPosts.createdAt)).limit(limit).offset(offset),
      db.select({ count: count() }).from(blogPosts).where(where),
    ]);
    return { items, total: totalResult[0].count, page, limit, totalPages: Math.ceil(totalResult[0].count / limit) };
  }

  async findPublishedBlogPosts(params: PaginationParams = {}): Promise<CmsPaginatedResult<typeof blogPosts.$inferSelect>> {
    const { page = 1, limit = 10, search } = params;
    const offset = (page - 1) * limit;
    const conditions = [isNull(blogPosts.deletedAt), eq(blogPosts.status, 'published')];
    if (search) {
      conditions.push(or(ilike(blogPosts.title, `%${search}%`), ilike(blogPosts.excerpt, `%${search}%`))!);
    }
    const where = and(...conditions);
    const [items, totalResult] = await Promise.all([
      db.select().from(blogPosts).where(where).orderBy(desc(blogPosts.publishedAt)).limit(limit).offset(offset),
      db.select({ count: count() }).from(blogPosts).where(where),
    ]);
    return { items, total: totalResult[0].count, page, limit, totalPages: Math.ceil(totalResult[0].count / limit) };
  }

  async findBlogPostBySlug(slug: string) {
    const [result] = await db.select().from(blogPosts).where(and(eq(blogPosts.slug, slug), isNull(blogPosts.deletedAt)));
    return result;
  }

  async findBlogPostById(id: string) {
    const [result] = await db.select().from(blogPosts).where(and(eq(blogPosts.id, id), isNull(blogPosts.deletedAt)));
    return result;
  }

  async createBlogPost(data: typeof blogPosts.$inferInsert) {
    const [result] = await db.insert(blogPosts).values(data).returning();
    return result;
  }

  async updateBlogPost(id: string, data: Partial<typeof blogPosts.$inferInsert>) {
    const [result] = await db.update(blogPosts).set({ ...data, updatedAt: new Date() }).where(eq(blogPosts.id, id)).returning();
    return result;
  }

  async softDeleteBlogPost(id: string, deletedBy: string) {
    await db.update(blogPosts).set({ deletedAt: new Date(), deletedBy, updatedAt: new Date() }).where(eq(blogPosts.id, id));
  }

  async countBlogPosts(status?: string) {
    const conditions = [isNull(blogPosts.deletedAt)];
    if (status) conditions.push(eq(blogPosts.status, status as any));
    const [result] = await db.select({ count: count() }).from(blogPosts).where(and(...conditions));
    return result.count;
  }

  // ── Media Uploads ──────────────────────────────────────────────────────────

  async findMediaUploads(params: PaginationParams = {}): Promise<CmsPaginatedResult<typeof mediaUploads.$inferSelect>> {
    const { page = 1, limit = 10, search } = params;
    const offset = (page - 1) * limit;
    const conditions = [isNull(mediaUploads.deletedAt)];
    if (search) {
      conditions.push(or(ilike(mediaUploads.filename, `%${search}%`), ilike(mediaUploads.altText, `%${search}%`))!);
    }
    const where = and(...conditions);
    const [items, totalResult] = await Promise.all([
      db.select().from(mediaUploads).where(where).orderBy(desc(mediaUploads.createdAt)).limit(limit).offset(offset),
      db.select({ count: count() }).from(mediaUploads).where(where),
    ]);
    return { items, total: totalResult[0].count, page, limit, totalPages: Math.ceil(totalResult[0].count / limit) };
  }

  async findMediaUploadById(id: string) {
    const [result] = await db.select().from(mediaUploads).where(and(eq(mediaUploads.id, id), isNull(mediaUploads.deletedAt)));
    return result;
  }

  async createMediaUpload(data: typeof mediaUploads.$inferInsert) {
    const [result] = await db.insert(mediaUploads).values(data).returning();
    return result;
  }

  async updateMediaUpload(id: string, data: Partial<typeof mediaUploads.$inferInsert>) {
    const [result] = await db.update(mediaUploads).set({ ...data, updatedAt: new Date() }).where(eq(mediaUploads.id, id)).returning();
    return result;
  }

  async softDeleteMediaUpload(id: string, deletedBy: string) {
    await db.update(mediaUploads).set({ deletedAt: new Date(), deletedBy, updatedAt: new Date() }).where(eq(mediaUploads.id, id));
  }

  async countMediaUploads() {
    const [result] = await db.select({ count: count() }).from(mediaUploads).where(isNull(mediaUploads.deletedAt));
    return result.count;
  }

  // ── Homepage Sections ──────────────────────────────────────────────────────

  async findHomepageSections() {
    return db.select().from(homepageSections).where(and(isNull(homepageSections.deletedAt), eq(homepageSections.isEnabled, true))).orderBy(asc(homepageSections.displayOrder));
  }

  async findAllHomepageSections() {
    return db.select().from(homepageSections).where(isNull(homepageSections.deletedAt)).orderBy(asc(homepageSections.displayOrder));
  }

  async findHomepageSectionById(id: string) {
    const [result] = await db.select().from(homepageSections).where(and(eq(homepageSections.id, id), isNull(homepageSections.deletedAt)));
    return result;
  }

  async createHomepageSection(data: typeof homepageSections.$inferInsert) {
    const [result] = await db.insert(homepageSections).values(data).returning();
    return result;
  }

  async updateHomepageSection(id: string, data: Partial<typeof homepageSections.$inferInsert>) {
    const [result] = await db.update(homepageSections).set({ ...data, updatedAt: new Date() }).where(eq(homepageSections.id, id)).returning();
    return result;
  }

  async deleteHomepageSection(id: string) {
    await db.update(homepageSections).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(homepageSections.id, id));
  }
}

export const newCmsRepository = new NewCmsRepository();
