'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth';
import { requirePermission } from '@/lib/auth/rbac';
import { CmsService } from '@/server/services';
import { handleError, type ActionResult } from '@/lib/errors/action-error';
import { AuditService } from '@/server/services/auditService';

const cmsService = new CmsService();
const auditService = new AuditService();

function revalidateCmsPage(slug?: string) {
  revalidatePath('/');
  if (slug) revalidatePath(`/${slug}`);
  revalidatePath('/about');
  revalidatePath('/privacy-policy');
  revalidatePath('/terms');
  revalidatePath('/shipping');
  revalidatePath('/inspection');
  revalidatePath('/payment');
  revalidatePath('/faq');
}

// ── Pages ─────────────────────────────────────────────────────────────────────

export async function listCmsPages(options: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
} = {}): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'cms.read');
    const data = await cmsService.listPages(options);
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function getCmsPage(id: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'cms.read');
    const data = await cmsService.getPage(id);
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function getCmsPageBySlug(slug: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'cms.read');
    const data = await cmsService.getPageBySlug(slug);
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function createCmsPage(data: {
  slug: string;
  title: string;
  content?: string;
  status?: 'draft' | 'published' | 'archived';
  featuredImageUrl?: string;
  seoTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogImage?: string;
  robotsIndex?: boolean;
  robotsFollow?: boolean;
}): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'cms.create');
    const created = await cmsService.createPage({
      ...data,
      status: data.status ?? 'draft',
      robotsIndex: data.robotsIndex ?? true,
      robotsFollow: data.robotsFollow ?? true,
    });
    await auditService.logAction({
      action: 'cms.page.created',
      entityType: 'cms_page',
      entityId: (created as { id: string }).id,
      entityLabel: data.title,
      metadata: { slug: data.slug },
    });
    revalidateCmsPage(data.slug);
    return { success: true, data: created };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateCmsPage(id: string, data: Record<string, unknown>): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'cms.update');
    const updated = await cmsService.updatePage(id, data as any);
    await auditService.logAction({
      action: 'cms.page.updated',
      entityType: 'cms_page',
      entityId: id,
      entityLabel: (data.title as string) ?? 'Page',
      changes: Object.fromEntries(
        Object.entries(data).filter(([k]) => k !== 'content').map(([k, v]) => [k, { old: null, new: v }]),
      ),
    });
    revalidateCmsPage(data.slug as string | undefined);
    return { success: true, data: updated };
  } catch (error) {
    return handleError(error);
  }
}

export async function publishCmsPage(id: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'cms.publish');
    const page = await cmsService.getPage(id);
    const updated = await cmsService.publishPage(id);
    await auditService.logAction({
      action: 'cms.page.published',
      entityType: 'cms_page',
      entityId: id,
      entityLabel: page.title,
    });
    revalidateCmsPage(page.slug);
    return { success: true, data: updated };
  } catch (error) {
    return handleError(error);
  }
}

export async function unpublishCmsPage(id: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'cms.publish');
    const page = await cmsService.getPage(id);
    const updated = await cmsService.unpublishPage(id);
    await auditService.logAction({
      action: 'cms.page.unpublished',
      entityType: 'cms_page',
      entityId: id,
      entityLabel: page.title,
    });
    revalidateCmsPage(page.slug);
    return { success: true, data: updated };
  } catch (error) {
    return handleError(error);
  }
}

export async function archiveCmsPage(id: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'cms.manage');
    const page = await cmsService.getPage(id);
    const updated = await cmsService.archivePage(id);
    await auditService.logAction({
      action: 'cms.page.archived',
      entityType: 'cms_page',
      entityId: id,
      entityLabel: page.title,
    });
    revalidateCmsPage(page.slug);
    return { success: true, data: updated };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteCmsPage(id: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'cms.delete');
    const page = await cmsService.getPage(id);
    await cmsService.deletePage(id);
    await auditService.logAction({
      action: 'cms.page.deleted',
      entityType: 'cms_page',
      entityId: id,
      entityLabel: page.title,
    });
    revalidateCmsPage(page.slug);
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

export async function restoreCmsPage(id: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'cms.manage');
    await cmsService.restorePage(id);
    await auditService.logAction({
      action: 'cms.page.restored',
      entityType: 'cms_page',
      entityId: id,
      entityLabel: 'Page',
    });
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

// ── Page Versions ─────────────────────────────────────────────────────────────

export async function listCmsPageVersions(pageId: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'cms.read');
    const data = await cmsService.listVersions(pageId);
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function createCmsPageVersion(pageId: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'cms.update');
    const data = await cmsService.createVersion(pageId, auth.userId);
    await auditService.logAction({
      action: 'cms.page.version_created',
      entityType: 'cms_page_version',
      entityId: pageId,
      entityLabel: `Version ${(data as { versionNumber: number }).versionNumber}`,
    });
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function restoreCmsPageVersion(versionId: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'cms.update');
    await cmsService.restoreVersion(versionId, auth.userId);
    await auditService.logAction({
      action: 'cms.page.version_restored',
      entityType: 'cms_page_version',
      entityId: versionId,
      entityLabel: 'Version restored',
    });
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

// ── Homepage Sections ─────────────────────────────────────────────────────────

export async function listHomepageSections(): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'cms.read');
    const data = await cmsService.listSections();
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function getHomepageSection(id: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'cms.read');
    const data = await cmsService.getSection(id);
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function createHomepageSection(data: Record<string, unknown>): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'cms.create');
    const created = await cmsService.createSection(data as any);
    await auditService.logAction({
      action: 'cms.section.created',
      entityType: 'homepage_section',
      entityId: (created as { id: string }).id,
      entityLabel: (data.type as string) ?? 'Section',
    });
    revalidatePath('/');
    return { success: true, data: created };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateHomepageSection(id: string, data: Record<string, unknown>): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'cms.update');
    const updated = await cmsService.updateSection(id, data as any);
    await auditService.logAction({
      action: 'cms.section.updated',
      entityType: 'homepage_section',
      entityId: id,
      entityLabel: (data.title as string) ?? 'Section',
      changes: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, { old: null, new: v }]),
      ),
    });
    revalidatePath('/');
    return { success: true, data: updated };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateAllHomepageSections(
  sections: Array<{ id: string; isEnabled: boolean; displayOrder: number; title: string | null; subtitle: string | null; content: string | null; imageUrl: string | null; extraData: Record<string, unknown> | null }>,
): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'cms.update');
    for (const s of sections) {
      await cmsService.updateSection(s.id, s as any);
    }
    await auditService.logAction({
      action: 'cms.sections.bulk_updated',
      entityType: 'homepage_section',
      entityId: 'bulk',
      entityLabel: `${sections.length} sections`,
      changes: { count: { old: null, new: sections.length } },
    });
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteHomepageSection(id: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'cms.delete');
    await cmsService.deleteSection(id);
    await auditService.logAction({
      action: 'cms.section.deleted',
      entityType: 'homepage_section',
      entityId: id,
      entityLabel: 'Section',
    });
    revalidatePath('/');
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

export async function reorderHomepageSections(orderedIds: string[]): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'cms.update');
    await cmsService.reorderSections(orderedIds);
    await auditService.logAction({
      action: 'cms.section.reordered',
      entityType: 'homepage_section',
      entityId: 'all',
      entityLabel: `${orderedIds.length} sections`,
      metadata: { order: orderedIds },
    });
    revalidatePath('/');
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

// ── Menus ─────────────────────────────────────────────────────────────────────

export async function listMenus(location?: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'cms.read');
    const data = await cmsService.listMenus(location);
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function getMenu(id: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'cms.read');
    const data = await cmsService.getMenu(id);
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function createMenu(data: Record<string, unknown>): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'cms.create');
    const created = await cmsService.createMenu(data as any);
    await auditService.logAction({
      action: 'cms.menu.created',
      entityType: 'menu',
      entityId: (created as { id: string }).id,
      entityLabel: (data.label as string) ?? 'Menu item',
    });
    revalidatePath('/');
    return { success: true, data: created };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateMenu(id: string, data: Record<string, unknown>): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'cms.update');
    const updated = await cmsService.updateMenu(id, data as any);
    await auditService.logAction({
      action: 'cms.menu.updated',
      entityType: 'menu',
      entityId: id,
      entityLabel: (data.label as string) ?? 'Menu item',
      changes: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, { old: null, new: v }]),
      ),
    });
    revalidatePath('/');
    return { success: true, data: updated };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteMenu(id: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'cms.delete');
    await cmsService.deleteMenu(id);
    await auditService.logAction({
      action: 'cms.menu.deleted',
      entityType: 'menu',
      entityId: id,
      entityLabel: 'Menu item',
    });
    revalidatePath('/');
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

export async function reorderMenus(location: string, orderedIds: string[]): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'cms.update');
    await cmsService.reorderMenus(location, orderedIds);
    await auditService.logAction({
      action: 'cms.menu.reordered',
      entityType: 'menu',
      entityId: location,
      entityLabel: `${orderedIds.length} items in ${location}`,
      metadata: { location, order: orderedIds },
    });
    revalidatePath('/');
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

// ── Banners ────────────────────────────────────────────────────────────────────

export async function listBanners(options: { page?: number; limit?: number; search?: string } = {}): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'cms.read');
    const data = await cmsService.listBanners(options);
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function getBanner(id: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'cms.read');
    const data = await cmsService.getBanner(id);
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function createBanner(data: {
  title: string;
  description?: string;
  imageUrl?: string;
  mobileImageUrl?: string;
  buttonText?: string;
  buttonLink?: string;
  placement?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  displayOrder?: number;
}): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'cms.create');
    const created = await cmsService.createBanner({
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    }, auth.userId);
    await auditService.logAction({
      action: 'cms.banner.created',
      entityType: 'banner',
      entityId: (created as { id: string }).id,
      entityLabel: data.title,
    });
    revalidatePath('/');
    return { success: true, data: created };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateBanner(id: string, data: Record<string, unknown>): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'cms.update');
    const updated = await cmsService.updateBanner(id, {
      ...data,
      startDate: data.startDate ? new Date(data.startDate as string) : undefined,
      endDate: data.endDate ? new Date(data.endDate as string) : undefined,
    }, auth.userId);
    await auditService.logAction({
      action: 'cms.banner.updated',
      entityType: 'banner',
      entityId: id,
      entityLabel: (data.title as string) ?? 'Banner',
      changes: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, { old: null, new: v }]),
      ),
    });
    revalidatePath('/');
    return { success: true, data: updated };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteBanner(id: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'cms.delete');
    await cmsService.deleteBanner(id, auth.userId);
    await auditService.logAction({
      action: 'cms.banner.deleted',
      entityType: 'banner',
      entityId: id,
      entityLabel: 'Banner',
    });
    revalidatePath('/');
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

// ── Testimonials ───────────────────────────────────────────────────────────────

export async function listTestimonials(options: { page?: number; limit?: number; search?: string } = {}): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'cms.read');
    const data = await cmsService.listTestimonials(options);
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function getTestimonial(id: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'cms.read');
    const data = await cmsService.getTestimonial(id);
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function createTestimonial(data: {
  customerName: string;
  customerLocation?: string;
  customerImageUrl?: string;
  quote: string;
  rating?: number;
  vehicleId?: string;
  videoUrl?: string;
  isPublished?: boolean;
  displayOrder?: number;
}): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'cms.create');
    const created = await cmsService.createTestimonial(data, auth.userId);
    await auditService.logAction({
      action: 'cms.testimonial.created',
      entityType: 'testimonial',
      entityId: (created as { id: string }).id,
      entityLabel: data.customerName,
    });
    revalidatePath('/');
    return { success: true, data: created };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateTestimonial(id: string, data: Record<string, unknown>): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'cms.update');
    const updated = await cmsService.updateTestimonial(id, data, auth.userId);
    await auditService.logAction({
      action: 'cms.testimonial.updated',
      entityType: 'testimonial',
      entityId: id,
      entityLabel: (data.customerName as string) ?? 'Testimonial',
      changes: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, { old: null, new: v }]),
      ),
    });
    revalidatePath('/');
    return { success: true, data: updated };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteTestimonial(id: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'cms.delete');
    await cmsService.deleteTestimonial(id, auth.userId);
    await auditService.logAction({
      action: 'cms.testimonial.deleted',
      entityType: 'testimonial',
      entityId: id,
      entityLabel: 'Testimonial',
    });
    revalidatePath('/');
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

// ── FAQs ──────────────────────────────────────────────────────────────────────

export async function listFaqs(options: { page?: number; limit?: number; search?: string } = {}): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'cms.read');
    const data = await cmsService.listFaqs(options);
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function getFaq(id: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'cms.read');
    const data = await cmsService.getFaq(id);
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function createFaq(data: {
  question: string;
  answer: string;
  category?: string;
  displayOrder?: number;
  isPublished?: boolean;
}): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'cms.create');
    const created = await cmsService.createFaq(data, auth.userId);
    await auditService.logAction({
      action: 'cms.faq.created',
      entityType: 'faq',
      entityId: (created as { id: string }).id,
      entityLabel: data.question,
    });
    revalidatePath('/');
    return { success: true, data: created };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateFaq(id: string, data: Record<string, unknown>): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'cms.update');
    const updated = await cmsService.updateFaq(id, data, auth.userId);
    await auditService.logAction({
      action: 'cms.faq.updated',
      entityType: 'faq',
      entityId: id,
      entityLabel: (data.question as string) ?? 'FAQ',
      changes: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, { old: null, new: v }]),
      ),
    });
    revalidatePath('/');
    return { success: true, data: updated };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteFaq(id: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'cms.delete');
    await cmsService.deleteFaq(id, auth.userId);
    await auditService.logAction({
      action: 'cms.faq.deleted',
      entityType: 'faq',
      entityId: id,
      entityLabel: 'FAQ',
    });
    revalidatePath('/');
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

// ── Blog Posts ────────────────────────────────────────────────────────────────

export async function listBlogPosts(options: { page?: number; limit?: number; search?: string } = {}): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'cms.read');
    const data = await cmsService.listBlogPosts(options);
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function getBlogPost(id: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'cms.read');
    const data = await cmsService.getBlogPost(id);
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function createBlogPost(data: {
  title: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  featuredImageUrl?: string;
  author?: string;
  category?: string;
  tags?: string;
  status?: 'draft' | 'published' | 'archived';
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
}): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'cms.create');
    const created = await cmsService.createBlogPost(data, auth.userId);
    await auditService.logAction({
      action: 'cms.post.created',
      entityType: 'blog_post',
      entityId: (created as { id: string }).id,
      entityLabel: data.title,
    });
    revalidatePath('/blog');
    return { success: true, data: created };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateBlogPost(id: string, data: Record<string, unknown>): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'cms.update');
    const updated = await cmsService.updateBlogPost(id, data, auth.userId);
    await auditService.logAction({
      action: 'cms.post.updated',
      entityType: 'blog_post',
      entityId: id,
      entityLabel: (data.title as string) ?? 'Blog post',
      changes: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, { old: null, new: v }]),
      ),
    });
    revalidatePath('/blog');
    return { success: true, data: updated };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteBlogPost(id: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'cms.delete');
    await cmsService.deleteBlogPost(id, auth.userId);
    await auditService.logAction({
      action: 'cms.post.deleted',
      entityType: 'blog_post',
      entityId: id,
      entityLabel: 'Blog post',
    });
    revalidatePath('/blog');
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

// ── Media ─────────────────────────────────────────────────────────────────────

export async function listMediaUploads(options: { page?: number; limit?: number; search?: string } = {}): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'cms.read');
    const data = await cmsService.listMediaUploads(options);
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function getMediaUpload(id: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'cms.read');
    const data = await cmsService.getMediaUpload(id);
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function createMediaUpload(data: {
  filename: string;
  storagePath: string;
  mimeType?: string;
  fileSize?: number;
  width?: number;
  height?: number;
  altText?: string;
}): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'cms.create');
    const created = await cmsService.createMediaUpload(data, auth.userId);
    await auditService.logAction({
      action: 'cms.media.created',
      entityType: 'media_upload',
      entityId: (created as { id: string }).id,
      entityLabel: data.filename,
    });
    return { success: true, data: created };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateMediaUpload(id: string, data: Record<string, unknown>): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'cms.update');
    const updated = await cmsService.updateMediaUpload(id, data);
    await auditService.logAction({
      action: 'cms.media.updated',
      entityType: 'media_upload',
      entityId: id,
      entityLabel: (data.filename as string) ?? 'Media',
      changes: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, { old: null, new: v }]),
      ),
    });
    return { success: true, data: updated };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteMediaUpload(id: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'cms.delete');
    await cmsService.deleteMediaUpload(id, auth.userId);
    await auditService.logAction({
      action: 'cms.media.deleted',
      entityType: 'media_upload',
      entityId: id,
      entityLabel: 'Media',
    });
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

// ── Public Actions ────────────────────────────────────────────────────────────

export async function getPublishedTestimonials(): Promise<ActionResult> {
  try {
    const data = await cmsService.getPublishedTestimonials();
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function getPublishedFaqs(): Promise<ActionResult> {
  try {
    const data = await cmsService.getPublishedFaqs();
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function getPublishedBlogPosts(options: { page?: number; limit?: number; search?: string } = {}): Promise<ActionResult> {
  try {
    const data = await cmsService.getPublishedBlogPosts(options);
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function getBlogPostBySlug(slug: string): Promise<ActionResult> {
  try {
    const data = await cmsService.getBlogPostBySlug(slug);
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function getActiveBanners(placement?: string): Promise<ActionResult> {
  try {
    const data = await cmsService.getActiveBanners(placement);
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function getHomepageSections(): Promise<ActionResult> {
  try {
    const data = await cmsService.getActiveHomepageSections();
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

// ── Homepage Builder Config Data ──────────────────────────────────────────────

export async function getHomepageConfigData(): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'cms.update');
    const { createServiceRoleClient } = await import('@/lib/supabase/service-role');
    const supabase = createServiceRoleClient();

    const [currenciesRes, manufacturersRes, continentsRes, countriesRes, vehicleCountsRes] = await Promise.all([
      supabase.from('currencies').select('id, code, name, symbol, is_active').order('display_order'),
      supabase.from('manufacturers').select('id, name, logo_url, is_active').order('display_order').order('name'),
      supabase.from('continents').select('id, name, slug, is_active').order('display_order'),
      supabase.from('countries').select('id, name, slug, flag_image, continent_id, is_active').order('display_order').order('name'),
      supabase.from('vehicles').select('manufacturer_id').is('deleted_at', null).eq('status', 'active'),
    ]);

    const countMap = new Map<string, number>();
    (vehicleCountsRes.data ?? []).forEach((v: any) => {
      countMap.set(v.manufacturer_id, (countMap.get(v.manufacturer_id) ?? 0) + 1);
    });

    return {
      success: true,
      data: {
        currencies: currenciesRes.data ?? [],
        manufacturers: (manufacturersRes.data ?? []).map((m: any) => ({
          id: m.id, name: m.name, logo_url: m.logo_url, is_active: m.is_active, count: countMap.get(m.id) ?? 0,
        })),
        continents: continentsRes.data ?? [],
        countries: countriesRes.data ?? [],
      },
    };
  } catch (error) {
    return handleError(error);
  }
}

const ALLOWED_LOOKUP_TABLES = new Set(['body_types', 'fuel_types', 'transmissions', 'drive_types']);

export async function getHomepageLookupData(tableName: string): Promise<ActionResult> {
  try {
    if (!ALLOWED_LOOKUP_TABLES.has(tableName)) throw new Error('Invalid table');
    const auth = await requireAuth();
    await requirePermission(auth, 'cms.update');
    const { createServiceRoleClient } = await import('@/lib/supabase/service-role');
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase.from(tableName).select('id, name, is_active').order('display_order').order('name');
    if (error) throw error;
    return { success: true, data: (data ?? []).map((r: any) => ({ id: r.id, name: r.name, isActive: r.is_active })) };
  } catch (error) {
    return handleError(error);
  }
}

export async function toggleHomepageLookupItem(tableName: string, id: string, isActive: boolean): Promise<ActionResult> {
  try {
    if (!ALLOWED_LOOKUP_TABLES.has(tableName)) throw new Error('Invalid table');
    const auth = await requireAuth();
    await requirePermission(auth, 'cms.update');
    const { createServiceRoleClient } = await import('@/lib/supabase/service-role');
    const supabase = createServiceRoleClient();
    const { error } = await supabase.from(tableName).update({ is_active: isActive, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

export async function reorderHomepageLookupItems(tableName: string, orderedIds: string[]): Promise<ActionResult> {
  try {
    if (!ALLOWED_LOOKUP_TABLES.has(tableName)) throw new Error('Invalid table');
    const auth = await requireAuth();
    await requirePermission(auth, 'cms.update');
    const { createServiceRoleClient } = await import('@/lib/supabase/service-role');
    const supabase = createServiceRoleClient();
    for (let i = 0; i < orderedIds.length; i++) {
      await supabase.from(tableName).update({ display_order: i, updated_at: new Date().toISOString() }).eq('id', orderedIds[i]);
    }
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}
