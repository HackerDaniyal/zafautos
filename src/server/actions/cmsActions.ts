'use server';

import { requireAuth } from '@/lib/auth';
import { requirePermission } from '@/lib/auth/rbac';
import { CmsService } from '@/server/services';
import { handleError, type ActionResult } from '@/lib/errors/action-error';
import { AuditService } from '@/server/services/auditService';

const cmsService = new CmsService();
const auditService = new AuditService();

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
    return { success: true, data: updated };
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
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}
