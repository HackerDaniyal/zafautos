'use server';

import { requireAuth } from '@/lib/auth';
import { requireRole } from '@/lib/auth/rbac';
import { AuthRepository } from '@/server/repositories';
import { handleError, type ActionResult } from '@/lib/errors/action-error';
import { AuditService } from '@/server/services/auditService';
import { ValidationError } from '@/server/services/errors';
import { roles as rolesTable } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';

const authRepo = new AuthRepository();
const auditService = new AuditService();

const SYSTEM_ROLES = ['super_admin', 'admin', 'dealer', 'customer'];

function isSystemRole(slug: string): boolean {
  return SYSTEM_ROLES.includes(slug);
}

// ── Permission Groups ──────────────────────────────────────────────────────

const PERMISSION_GROUPS: Record<string, string[]> = {
  Vehicles: ['vehicles.create', 'vehicles.read', 'vehicles.update', 'vehicles.delete'],
  Orders: ['orders.create', 'orders.read', 'orders.update', 'orders.delete'],
  Customers: ['customers.read', 'customers.update'],
  Dealers: ['dealers.read', 'dealers.update'],
  Payments: ['payments.read', 'payments.create'],
  Settings: ['settings.read', 'settings.update'],
  Analytics: ['analytics.read'],
};

// ── Actions ────────────────────────────────────────────────────────────────

export async function listRoles(): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    requireRole(auth, 'admin', 'super_admin');

    const roles = await authRepo.listRoles();
    return { success: true, data: roles };
  } catch (error) {
    return handleError(error);
  }
}

export async function getRole(id: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    requireRole(auth, 'admin', 'super_admin');

    const role = await authRepo.findRoleById(id);
    if (!role) throw new ValidationError('Role not found');

    const permissionIds = await authRepo.getRolePermissions(id);
    const userCount = await authRepo.countUsersByRoleId(id);

    return {
      success: true,
      data: {
        ...role,
        permissionIds,
        userCount,
        isSystem: isSystemRole(role.slug),
      },
    };
  } catch (error) {
    return handleError(error);
  }
}

export async function createRole(data: {
  name: string;
  slug: string;
  description?: string;
}): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    requireRole(auth, 'super_admin');

    const slug = data.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (isSystemRole(slug)) {
      throw new ValidationError('Cannot create a role with a system slug');
    }

    const existing = await authRepo.findRoleBySlug(slug);
    if (existing) throw new ValidationError(`Role with slug "${slug}" already exists`);

    const [created] = await db.insert(rolesTable).values({
      name: data.name,
      slug,
      description: data.description ?? null,
      createdBy: auth.userId,
      updatedBy: auth.userId,
    }).returning();

    await auditService.logAction({
      action: 'role.created',
      entityType: 'role',
      entityId: created.id,
      entityLabel: data.name,
      changes: { name: { old: null, new: data.name }, slug: { old: null, new: slug } },
    });

    return { success: true, data: created };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateRole(
  id: string,
  data: { name?: string; description?: string },
): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    requireRole(auth, 'super_admin');

    const role = await authRepo.findRoleById(id);
    if (!role) throw new ValidationError('Role not found');
    if (isSystemRole(role.slug)) {
      throw new ValidationError('Cannot modify system roles');
    }

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    updateData.updatedAt = new Date();
    updateData.updatedBy = auth.userId;

    await db.update(rolesTable).set(updateData).where(eq(rolesTable.id, id));

    await auditService.logAction({
      action: 'role.updated',
      entityType: 'role',
      entityId: id,
      entityLabel: data.name ?? role.name,
      changes: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, { old: null, new: v }])
      ),
    });

    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteRole(id: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    requireRole(auth, 'super_admin');

    const role = await authRepo.findRoleById(id);
    if (!role) throw new ValidationError('Role not found');
    if (isSystemRole(role.slug)) {
      throw new ValidationError('Cannot delete system roles');
    }

    const userCount = await authRepo.countUsersByRoleId(id);
    if (userCount > 0) {
      throw new ValidationError(`Cannot delete role with ${userCount} assigned user(s). Reassign them first.`);
    }

    await db.update(rolesTable).set({
      deletedAt: new Date(),
      deletedBy: auth.userId,
      updatedAt: new Date(),
      updatedBy: auth.userId,
    }).where(eq(rolesTable.id, id));

    await auditService.logAction({
      action: 'role.deleted',
      entityType: 'role',
      entityId: id,
      entityLabel: role.name,
    });

    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

export async function getPermissionGroups(): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    requireRole(auth, 'admin', 'super_admin');

    const allPermissions = await authRepo.getPermissions();

    const groups = Object.entries(PERMISSION_GROUPS).map(([group, slugs]) => ({
      group,
      permissions: allPermissions
        .filter((p) => slugs.includes(p.slug))
        .map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          description: p.description,
        })),
    }));

    return { success: true, data: groups };
  } catch (error) {
    return handleError(error);
  }
}

export async function getRolePermissions(roleId: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    requireRole(auth, 'admin', 'super_admin');

    const permissionIds = await authRepo.getRolePermissions(roleId);
    return { success: true, data: permissionIds };
  } catch (error) {
    return handleError(error);
  }
}

export async function assignPermissions(
  roleId: string,
  permissionIds: string[],
): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    requireRole(auth, 'super_admin');

    const role = await authRepo.findRoleById(roleId);
    if (!role) throw new ValidationError('Role not found');
    if (isSystemRole(role.slug)) {
      throw new ValidationError('Cannot modify permissions for system roles');
    }

    await authRepo.assignPermissions(roleId, permissionIds);

    await auditService.logAction({
      action: 'role.permissions_assigned',
      entityType: 'role',
      entityId: roleId,
      entityLabel: role.name,
      changes: { permissionCount: { old: null, new: permissionIds.length } },
    });

    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}
