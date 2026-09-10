'use server';

import { requireAuth } from '@/lib/auth';
import { requirePermission } from '@/lib/auth/rbac';
import { handleError, type ActionResult } from '@/lib/errors/action-error';
import { AuditService } from '@/server/services/auditService';
import { db } from '@/server/db/client';
import {
  vehicleEnquiries,
  leadNotes,
  vehicles,
  users,
  orders,
  orderItems,
} from '@/server/db/schema';
import { eq, and, sql, desc, asc, ilike, or, count, gte, lte } from 'drizzle-orm';
import { z } from 'zod';

const auditService = new AuditService();

// ── Types ──────────────────────────────────────────

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'negotiating' | 'converted' | 'lost';

export interface LeadListParams {
  page?: number;
  limit?: number;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  search?: string;
  status?: LeadStatus;
  vehicleId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface LeadDetail {
  id: string;
  vehicleId: string;
  userId: string | null;
  message: string;
  status: LeadStatus;
  source: string;
  assignedTo: string | null;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  customerCountry: string | null;
  contactedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  vehicle?: {
    id: string;
    year: number | null;
    make: string;
    model: string;
    price: number | null;
    stockNumber: string | null;
    vin: string | null;
    slug: string | null;
    imageUrl: string | null;
  };
  assignedUser?: {
    id: string;
    email: string;
  } | null;
  notes: Array<{
    id: string;
    note: string;
    createdAt: Date;
    createdByUser: { email: string } | null;
  }>;
}

// ── List Leads ─────────────────────────────────────

export async function listLeads(params: LeadListParams): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.read');

    const page = params.page || 1;
    const limit = Math.min(params.limit || 20, 100);
    const sortColumn = params.sortColumn || 'createdAt';
    const sortDirection = params.sortDirection || 'desc';

    // Build conditions
    const conditions = [sql`${vehicleEnquiries.deletedAt} IS NULL`];

    if (params.status) {
      conditions.push(eq(vehicleEnquiries.status, params.status));
    }
    if (params.vehicleId) {
      conditions.push(eq(vehicleEnquiries.vehicleId, params.vehicleId));
    }
    if (params.dateFrom) {
      conditions.push(gte(vehicleEnquiries.createdAt, new Date(params.dateFrom)));
    }
    if (params.dateTo) {
      conditions.push(lte(vehicleEnquiries.createdAt, new Date(params.dateTo)));
    }
    if (params.search) {
      const searchTerm = `%${params.search}%`;
      conditions.push(
        or(
          ilike(vehicleEnquiries.customerName, searchTerm),
          ilike(vehicleEnquiries.customerEmail, searchTerm),
          ilike(vehicleEnquiries.customerPhone, searchTerm),
          ilike(vehicleEnquiries.message, searchTerm),
        )!,
      );
    }

    const where = and(...conditions);

    // Count total
    const [{ total }] = await db
      .select({ total: count() })
      .from(vehicleEnquiries)
      .where(where);

    // Sort column mapping
    const sortColumnMap: Record<string, any> = {
      createdAt: vehicleEnquiries.createdAt,
      status: vehicleEnquiries.status,
      customerName: vehicleEnquiries.customerName,
    };
    const orderFn = sortDirection === 'asc' ? asc : desc;
    const orderClause = orderFn(sortColumnMap[sortColumn] || vehicleEnquiries.createdAt);

    // Fetch leads with vehicle join
    const leads = await db
      .select({
        id: vehicleEnquiries.id,
        vehicleId: vehicleEnquiries.vehicleId,
        userId: vehicleEnquiries.userId,
        message: vehicleEnquiries.message,
        status: vehicleEnquiries.status,
        source: vehicleEnquiries.source,
        assignedTo: vehicleEnquiries.assignedTo,
        customerName: vehicleEnquiries.customerName,
        customerEmail: vehicleEnquiries.customerEmail,
        customerPhone: vehicleEnquiries.customerPhone,
        customerCountry: vehicleEnquiries.customerCountry,
        contactedAt: vehicleEnquiries.contactedAt,
        createdAt: vehicleEnquiries.createdAt,
        updatedAt: vehicleEnquiries.updatedAt,
        // Vehicle fields
        vehicleYear: vehicles.year,
        vehicleMake: sql<string>`manufacturers.name`,
        vehicleModel: sql<string>`models.name`,
        vehiclePrice: vehicles.price,
        vehicleStockNumber: vehicles.stockNumber,
        vehicleVin: vehicles.vin,
        vehicleSlug: vehicles.slug,
      })
      .from(vehicleEnquiries)
      .leftJoin(vehicles, eq(vehicleEnquiries.vehicleId, vehicles.id))
      .leftJoin(sql`manufacturers`, sql`manufacturers.id = ${vehicles.manufacturerId}`)
      .leftJoin(sql`models`, sql`models.id = ${vehicles.modelId}`)
      .where(where)
      .orderBy(orderClause)
      .limit(limit)
      .offset((page - 1) * limit);

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: {
        data: leads,
        meta: { total, totalPages, page, limit },
      },
    };
  } catch (error) {
    return handleError(error);
  }
}

// ── Get Lead Stats ─────────────────────────────────

export async function getLeadStats(): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.read');

    const [{ total }] = await db
      .select({ total: count() })
      .from(vehicleEnquiries)
      .where(sql`${vehicleEnquiries.deletedAt} IS NULL`);

    const byStatus = await db
      .select({
        status: vehicleEnquiries.status,
        count: count(),
      })
      .from(vehicleEnquiries)
      .where(sql`${vehicleEnquiries.deletedAt} IS NULL`)
      .groupBy(vehicleEnquiries.status);

    const statusMap: Record<string, number> = {};
    for (const row of byStatus) {
      statusMap[row.status] = row.count;
    }

    return {
      success: true,
      data: {
        totalLeads: total,
        new: statusMap['new'] || 0,
        contacted: statusMap['contacted'] || 0,
        qualified: statusMap['qualified'] || 0,
        negotiating: statusMap['negotiating'] || 0,
        converted: statusMap['converted'] || 0,
        lost: statusMap['lost'] || 0,
      },
    };
  } catch (error) {
    return handleError(error);
  }
}

// ── Get Lead Detail ────────────────────────────────

export async function getLeadDetail(leadId: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.read');

    const parsedId = z.string().uuid().safeParse(leadId);
    if (!parsedId.success) {
      return { success: false, error: 'Invalid lead ID' };
    }

    // Fetch lead with vehicle
    const [lead] = await db
      .select({
        id: vehicleEnquiries.id,
        vehicleId: vehicleEnquiries.vehicleId,
        userId: vehicleEnquiries.userId,
        message: vehicleEnquiries.message,
        status: vehicleEnquiries.status,
        source: vehicleEnquiries.source,
        assignedTo: vehicleEnquiries.assignedTo,
        customerName: vehicleEnquiries.customerName,
        customerEmail: vehicleEnquiries.customerEmail,
        customerPhone: vehicleEnquiries.customerPhone,
        customerCountry: vehicleEnquiries.customerCountry,
        contactedAt: vehicleEnquiries.contactedAt,
        createdAt: vehicleEnquiries.createdAt,
        updatedAt: vehicleEnquiries.updatedAt,
        // Vehicle fields
        vehicleYear: vehicles.year,
        vehicleMake: sql<string>`manufacturers.name`,
        vehicleModel: sql<string>`models.name`,
        vehiclePrice: vehicles.price,
        vehicleStockNumber: vehicles.stockNumber,
        vehicleVin: vehicles.vin,
        vehicleSlug: vehicles.slug,
      })
      .from(vehicleEnquiries)
      .leftJoin(vehicles, eq(vehicleEnquiries.vehicleId, vehicles.id))
      .leftJoin(sql`manufacturers`, sql`manufacturers.id = ${vehicles.manufacturerId}`)
      .leftJoin(sql`models`, sql`models.id = ${vehicles.modelId}`)
      .where(eq(vehicleEnquiries.id, leadId))
      .limit(1);

    if (!lead) {
      return { success: false, error: 'Lead not found' };
    }

    // Fetch assigned user
    let assignedUser = null;
    if (lead.assignedTo) {
      const [user] = await db
        .select({ id: users.id, email: users.email })
        .from(users)
        .where(eq(users.id, lead.assignedTo))
        .limit(1);
      assignedUser = user || null;
    }

    // Fetch notes
    const notes = await db
      .select({
        id: leadNotes.id,
        note: leadNotes.note,
        createdAt: leadNotes.createdAt,
        createdBy: leadNotes.createdBy,
      })
      .from(leadNotes)
      .where(
        and(
          eq(leadNotes.leadId, leadId),
          sql`${leadNotes.deletedAt} IS NULL`,
        ),
      )
      .orderBy(desc(leadNotes.createdAt));

    // Resolve note authors
    const noteAuthorIds = [...new Set(notes.map((n) => n.createdBy).filter(Boolean))] as string[];
    const noteAuthors: Record<string, { email: string }> = {};
    if (noteAuthorIds.length > 0) {
      const authors = await db
        .select({ id: users.id, email: users.email })
        .from(users)
        .where(sql`${users.id} IN ${noteAuthorIds}`);
      for (const a of authors) {
        noteAuthors[a.id] = { email: a.email };
      }
    }

    // Get vehicle image
    let vehicleImageUrl: string | null = null;
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      );
      const { data: imgData } = await supabase
        .from('vehicle_images')
        .select('image_url')
        .eq('vehicle_id', lead.vehicleId)
        .eq('is_primary', true)
        .limit(1);
      vehicleImageUrl = imgData?.[0]?.image_url || null;
    } catch {
      // Image fetch is non-critical
    }

    return {
      success: true,
      data: {
        ...lead,
        vehicle: lead.vehicleYear
          ? {
              id: lead.vehicleId,
              year: lead.vehicleYear,
              make: lead.vehicleMake,
              model: lead.vehicleModel,
              price: lead.vehiclePrice,
              stockNumber: lead.vehicleStockNumber,
              vin: lead.vehicleVin,
              slug: lead.vehicleSlug,
              imageUrl: vehicleImageUrl,
            }
          : null,
        assignedUser,
        notes: notes.map((n) => ({
          ...n,
          createdByUser: n.createdBy ? noteAuthors[n.createdBy] || null : null,
        })),
      },
    };
  } catch (error) {
    return handleError(error);
  }
}

// ── Update Lead Status ─────────────────────────────

const UpdateStatusSchema = z.object({
  leadId: z.string().uuid(),
  status: z.enum(['new', 'contacted', 'qualified', 'negotiating', 'converted', 'lost']),
});

export async function updateLeadStatus(data: z.infer<typeof UpdateStatusSchema>): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.update');

    const validated = UpdateStatusSchema.parse(data);

    const [existing] = await db
      .select({ id: vehicleEnquiries.id, status: vehicleEnquiries.status })
      .from(vehicleEnquiries)
      .where(
        and(
          eq(vehicleEnquiries.id, validated.leadId),
          sql`${vehicleEnquiries.deletedAt} IS NULL`,
        ),
      )
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Lead not found' };
    }

    const updateData: Record<string, any> = {
      status: validated.status,
      updatedAt: new Date(),
      updatedBy: auth.userId,
    };

    if (validated.status === 'contacted') {
      updateData.contactedAt = new Date();
    }

    await db
      .update(vehicleEnquiries)
      .set(updateData)
      .where(eq(vehicleEnquiries.id, validated.leadId));

    await auditService.logAction({
      action: 'lead.status_changed',
      entityType: 'lead',
      entityId: validated.leadId,
      metadata: {
        from: existing.status,
        to: validated.status,
      },
    });

    // Dispatch notification (non-blocking)
    try {
      const { notificationService } = await import('@/server/services/notificationService');
      const leadMessages: Record<string, { title: string; body: string; type: string }> = {
        qualified: { title: 'Lead Qualified', body: 'A lead has been marked as qualified.', type: 'lead.qualified' },
        converted: { title: 'Lead Converted', body: 'A lead has been successfully converted.', type: 'lead.converted' },
        lost: { title: 'Lead Lost', body: 'A lead has been marked as lost.', type: 'lead.lost' },
      };
      const msg = leadMessages[validated.status];
      if (msg) {
        // Notify assigned staff or all admins
        const lead = await db.select({ assignedTo: vehicleEnquiries.assignedTo, customerName: vehicleEnquiries.customerName }).from(vehicleEnquiries).where(eq(vehicleEnquiries.id, validated.leadId)).limit(1);
        const recipientIds: string[] = [];
        if (lead[0]?.assignedTo) {
          recipientIds.push(lead[0].assignedTo);
        } else {
          const admins = await db.select({ id: users.id }).from(users).where(eq(users.role, 'admin'));
          recipientIds.push(...admins.map(a => a.id));
        }
        for (const recipientId of recipientIds) {
          await notificationService.dispatch({
            userId: recipientId,
            type: msg.type,
            category: 'lead',
            title: msg.title,
            body: `${msg.body} Customer: ${lead[0]?.customerName ?? 'Unknown'}`,
            link: `/admin/leads`,
            metadata: { leadId: validated.leadId, status: validated.status, customerName: lead[0]?.customerName },
            eventKey: `lead:${validated.leadId}:status:${validated.status}`,
          });
        }
      }
    } catch (err) {
      console.error('Lead notification dispatch failed (non-blocking):', err);
    }

    return { success: true, data: null };
  } catch (error) {
    return handleError(error);
  }
}

// ── Assign Staff ───────────────────────────────────

const AssignStaffSchema = z.object({
  leadId: z.string().uuid(),
  assignedTo: z.string().uuid().nullable(),
});

export async function assignLeadStaff(data: z.infer<typeof AssignStaffSchema>): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.update');

    const validated = AssignStaffSchema.parse(data);

    await db
      .update(vehicleEnquiries)
      .set({
        assignedTo: validated.assignedTo,
        updatedAt: new Date(),
        updatedBy: auth.userId,
      })
      .where(eq(vehicleEnquiries.id, validated.leadId));

    await auditService.logAction({
      action: 'lead.assigned',
      entityType: 'lead',
      entityId: validated.leadId,
      metadata: { assignedTo: validated.assignedTo },
    });

    return { success: true, data: null };
  } catch (error) {
    return handleError(error);
  }
}

// ── Add Note ───────────────────────────────────────

const AddNoteSchema = z.object({
  leadId: z.string().uuid(),
  note: z.string().min(1, 'Note is required').max(5000).trim(),
});

export async function addLeadNote(data: z.infer<typeof AddNoteSchema>): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.update');

    const validated = AddNoteSchema.parse(data);

    // Verify lead exists
    const [existing] = await db
      .select({ id: vehicleEnquiries.id })
      .from(vehicleEnquiries)
      .where(
        and(
          eq(vehicleEnquiries.id, validated.leadId),
          sql`${vehicleEnquiries.deletedAt} IS NULL`,
        ),
      )
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Lead not found' };
    }

    const [note] = await db
      .insert(leadNotes)
      .values({
        leadId: validated.leadId,
        note: validated.note,
        createdBy: auth.userId,
      })
      .returning();

    await auditService.logAction({
      action: 'lead.note_added',
      entityType: 'lead',
      entityId: validated.leadId,
      metadata: { noteId: note.id },
    });

    return { success: true, data: note };
  } catch (error) {
    return handleError(error);
  }
}

// ── Convert Lead to Order ──────────────────────────

const ConvertToOrderSchema = z.object({
  leadId: z.string().uuid(),
});

export async function convertLeadToOrder(data: z.infer<typeof ConvertToOrderSchema>): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'orders.create');

    const validated = ConvertToOrderSchema.parse(data);

    // ── ALL VALIDATIONS BEFORE ANY WRITES ──

    // 1. Fetch lead
    const [lead] = await db
      .select()
      .from(vehicleEnquiries)
      .where(
        and(
          eq(vehicleEnquiries.id, validated.leadId),
          sql`${vehicleEnquiries.deletedAt} IS NULL`,
        ),
      )
      .limit(1);

    if (!lead) {
      return { success: false, error: 'Lead not found' };
    }

    // 2. Idempotency: already converted
    if (lead.status === 'converted') {
      return { success: false, error: 'Lead is already converted', code: 'ALREADY_CONVERTED' };
    }

    // 3. Lost leads cannot be converted
    if (lead.status === 'lost') {
      return { success: false, error: 'Lost leads cannot be converted', code: 'LEAD_LOST' };
    }

    // 4. Fetch vehicle with make/model names and verify it's active
    const [vehicleRow] = await db
      .select({
        id: vehicles.id,
        year: vehicles.year,
        manufacturerId: vehicles.manufacturerId,
        modelId: vehicles.modelId,
        price: vehicles.price,
        mileage: vehicles.mileage,
        vin: vehicles.vin,
        stockNumber: vehicles.stockNumber,
        status: vehicles.status,
        condition: vehicles.condition,
        slug: vehicles.slug,
        makeName: sql<string>`manufacturers.name`,
        modelName: sql<string>`models.name`,
      })
      .from(vehicles)
      .leftJoin(sql`manufacturers`, sql`manufacturers.id = ${vehicles.manufacturerId}`)
      .leftJoin(sql`models`, sql`models.id = ${vehicles.modelId}`)
      .where(
        and(
          eq(vehicles.id, lead.vehicleId),
          sql`${vehicles.deletedAt} IS NULL`,
        ),
      )
      .limit(1);

    if (!vehicleRow) {
      return { success: false, error: 'Vehicle not found or has been deleted', code: 'VEHICLE_NOT_FOUND' };
    }

    if (vehicleRow.status !== 'active') {
      return { success: false, error: `Vehicle is not available (status: ${vehicleRow.status})`, code: 'VEHICLE_NOT_AVAILABLE' };
    }

    // 5. Check no active order already exists for this vehicle (prevents double-sell)
    const [existingOrder] = await db
      .select({ id: orders.id, orderNumber: orders.orderNumber })
      .from(orders)
      .where(
        and(
          eq(orders.vehicleId, lead.vehicleId),
          sql`${orders.deletedAt} IS NULL`,
          sql`${orders.status} NOT IN ('cancelled')`,
        ),
      )
      .limit(1);

    if (existingOrder) {
      return {
        success: false,
        error: `Vehicle already has an active order (${existingOrder.orderNumber})`,
        code: 'VEHICLE_ALREADY_ORDERED',
      };
    }

    // ── ALL VALIDATIONS PASSED — EXECUTE IN TRANSACTION ──

    const result = await db.transaction(async (tx) => {
      // 6. Generate order number atomically — find highest existing number
      const [maxRow] = await tx
        .select({ maxNum: sql<number>`coalesce(max(cast(substring(${orders.orderNumber} from '\\d+$') as integer)), 0)` })
        .from(orders);
      const orderNumber = `ORD-${String((maxRow?.maxNum || 0) + 1).padStart(6, '0')}`;

      // 7. Create order
      const [order] = await tx
        .insert(orders)
        .values({
          orderNumber,
          vehicleId: lead.vehicleId,
          customerId: null,
          totalAmount: vehicleRow.price || 0,
          status: 'pending',
          createdBy: auth.userId,
        })
        .returning();

      // 8. Create order item with vehicle snapshot
      const vehicleSnapshot = {
        id: vehicleRow.id,
        year: vehicleRow.year,
        make: vehicleRow.makeName,
        model: vehicleRow.modelName,
        manufacturerId: vehicleRow.manufacturerId,
        modelId: vehicleRow.modelId,
        price: vehicleRow.price,
        mileage: vehicleRow.mileage,
        vin: vehicleRow.vin,
        stockNumber: vehicleRow.stockNumber,
        status: vehicleRow.status,
        condition: vehicleRow.condition,
        slug: vehicleRow.slug,
        snapshotAt: new Date().toISOString(),
      };

      await tx.insert(orderItems).values({
        orderId: order.id,
        vehicleId: lead.vehicleId,
        vehicleSnapshot,
        quantity: 1,
        price: vehicleRow.price || 0,
        createdBy: auth.userId,
      });

      // 9. Mark vehicle as sold
      await tx
        .update(vehicles)
        .set({
          status: 'sold',
          updatedAt: new Date(),
          updatedBy: auth.userId,
        })
        .where(eq(vehicles.id, lead.vehicleId));

      // 10. Update lead status to converted (LAST — only after all above succeed)
      await tx
        .update(vehicleEnquiries)
        .set({
          status: 'converted',
          updatedAt: new Date(),
          updatedBy: auth.userId,
        })
        .where(eq(vehicleEnquiries.id, validated.leadId));

      return { orderId: order.id, orderNumber };
    });

    // 11. Audit log (outside transaction — non-critical)
    await auditService.logAction({
      action: 'lead.converted_to_order',
      entityType: 'lead',
      entityId: validated.leadId,
      entityLabel: result.orderNumber,
      metadata: {
        orderId: result.orderId,
        orderNumber: result.orderNumber,
        vehicleId: lead.vehicleId,
        vehicleStatus: 'sold',
        convertedBy: auth.userId,
      },
    });

    return { success: true, data: result };
  } catch (error) {
    return handleError(error);
  }
}
