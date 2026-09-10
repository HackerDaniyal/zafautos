import { SupportRepository } from '@/server/repositories/supportRepository';
import { db } from '@/server/db/client';
import { customers, users, orders, vehicles, manufacturers, models } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { SupportTicketNotFoundError } from './errors';
import { auditService } from './auditService';
import { notificationService } from './notificationService';
import { z } from 'zod';

const supportRepo = new SupportRepository();

// Explicit ticket type to avoid complex BaseRepository inference issues
interface TicketRow {
  id: string;
  customerId: string | null;
  orderId: string | null;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  assignedTo: string | null;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
  closedAt: Date | null;
  createdBy: string | null;
  updatedBy: string | null;
  deletedAt: Date | null;
  deletedBy: string | null;
}

// ── Zod Schemas ────────────────────────────────────────────────────────────

export const createTicketSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(255),
  description: z.string().min(1, 'Description is required'),
  category: z.enum(['general', 'order', 'payment', 'shipping', 'document', 'vehicle', 'technical', 'other']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  orderId: z.string().uuid().optional(),
});

export const updateTicketSchema = z.object({
  status: z.enum(['open', 'in_progress', 'waiting_customer', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  category: z.enum(['general', 'order', 'payment', 'shipping', 'document', 'vehicle', 'technical', 'other']).optional(),
  assignedTo: z.string().uuid().nullable().optional(),
});

export const addMessageSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  attachmentUrl: z.string().url().optional(),
  attachmentName: z.string().max(255).optional(),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type AddMessageInput = z.infer<typeof addMessageSchema>;

// ── Service ────────────────────────────────────────────────────────────────

export class SupportService {
  /**
   * Create a new support ticket. Resolves the customer from userId.
   */
  async createTicket(userId: string, input: CreateTicketInput) {
    const [customer] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.userId, userId))
      .limit(1);

    if (!customer) throw new Error('Customer profile not found');

    // Validate order belongs to customer if provided
    if (input.orderId) {
      const [order] = await db
        .select({ id: orders.id })
        .from(orders)
        .where(and(eq(orders.id, input.orderId), eq(orders.customerId, customer.id)))
        .limit(1);
      if (!order) throw new Error('Order not found or does not belong to you');
    }

    const ticket = await supportRepo.createTicket({
      customerId: customer.id,
      orderId: input.orderId ?? null,
      subject: input.subject,
      description: input.description,
      category: input.category,
      priority: input.priority,
      status: 'open',
      createdBy: userId,
    });

    // Add the first message with the description
    await supportRepo.addMessage({
      ticketId: ticket.id,
      senderId: userId,
      senderType: 'customer',
      message: input.description,
    });

    // Create notification for staff (admin + super_admin users)
    const adminUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, 'admin'));

    const superAdminUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, 'super_admin'));

    const staffIds = [...new Set([...adminUsers.map(u => u.id), ...superAdminUsers.map(u => u.id)])];

    for (const staffId of staffIds) {
      await notificationService.dispatch({
        userId: staffId,
        type: 'support.ticket_created',
        category: 'support',
        title: 'New Support Ticket',
        body: `${input.subject} (${input.category})`,
        link: `/admin/support/${ticket.id}`,
        metadata: { ticketId: ticket.id, category: input.category, priority: input.priority },
        eventKey: `support:ticket:${ticket.id}:created`,
      });
    }

    // Audit log
    await auditService.logAction({
      action: 'ticket.created',
      entityType: 'support_ticket',
      entityId: ticket.id,
      entityLabel: ticket.subject,
      metadata: { customerId: customer.id, orderId: input.orderId ?? null, category: input.category, priority: input.priority },
    });

    return ticket;
  }

  /**
   * Get ticket detail with all relations (customer-scoped or staff).
   */
  async getTicketDetail(ticketId: string, userId: string, isStaff: boolean) {
    const ticket = await supportRepo.findTicketWithRelations(ticketId);
    if (!ticket) throw new SupportTicketNotFoundError(ticketId);

    // Ownership check for customers
    if (!isStaff && ticket.customerId) {
      const [customer] = await db
        .select({ id: customers.id })
        .from(customers)
        .where(eq(customers.userId, userId))
        .limit(1);
      if (!customer || customer.id !== ticket.customerId) {
        throw new SupportTicketNotFoundError(ticketId);
      }
    }

    // Get messages
    const messages = await supportRepo.getTicketMessages(ticketId);

    // Get related data
    let customerInfo: { email: string | null; firstName: string | null; lastName: string | null } | null = null;
    let orderInfo: { orderNumber: string | null; status: string | null } | null = null;
    let vehicleInfo: { make: string | null; model: string | null; year: number | null; stockNumber: string | null } | null = null;
    let assignedInfo: { email: string | null; firstName: string | null; lastName: string | null } | null = null;

    if (ticket.customerId) {
      const [cust] = await db
        .select({
          email: users.email,
          firstName: users.email,
        })
        .from(customers)
        .leftJoin(users, eq(customers.userId, users.id))
        .where(eq(customers.id, ticket.customerId))
        .limit(1);

      const [profile] = await db
        .select({ firstName: users.email })
        .from(customers)
        .leftJoin(users, eq(customers.userId, users.id))
        .where(eq(customers.id, ticket.customerId))
        .limit(1);

      if (cust) {
        const [p] = await db
          .select()
          .from(users)
          .where(eq(users.id, (await db.select({ userId: customers.userId }).from(customers).where(eq(customers.id, ticket.customerId)).limit(1))[0]?.userId ?? ''))
          .limit(1);
        customerInfo = { email: p?.email ?? null, firstName: null, lastName: null };
      }
    }

    if (ticket.orderId) {
      const [order] = await db
        .select({ orderNumber: orders.orderNumber, status: orders.status })
        .from(orders)
        .where(eq(orders.id, ticket.orderId))
        .limit(1);
      if (order) {
        orderInfo = { orderNumber: order.orderNumber, status: order.status };
        // Get vehicle info from order
        const [orderFull] = await db.select({ vehicleId: orders.vehicleId }).from(orders).where(eq(orders.id, ticket.orderId)).limit(1);
        if (orderFull?.vehicleId) {
          const [v] = await db
            .select({
              year: vehicles.year,
              stockNumber: vehicles.stockNumber,
              manufacturerName: manufacturers.name,
              modelName: models.name,
            })
            .from(vehicles)
            .leftJoin(manufacturers, eq(vehicles.manufacturerId, manufacturers.id))
            .leftJoin(models, eq(vehicles.modelId, models.id))
            .where(eq(vehicles.id, orderFull.vehicleId))
            .limit(1);
          if (v) vehicleInfo = { make: v.manufacturerName, model: v.modelName, year: v.year, stockNumber: v.stockNumber };
        }
      }
    }

    if (ticket.assignedTo) {
      const [staff] = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, ticket.assignedTo))
        .limit(1);
      assignedInfo = { email: staff?.email ?? null, firstName: null, lastName: null };
    }

    return {
      ...ticket,
      messages,
      customerInfo,
      orderInfo,
      vehicleInfo,
      assignedInfo,
    };
  }

  /**
   * List tickets (customer-scoped or staff).
   */
  async listTickets(
    userId: string,
    isStaff: boolean,
    filters: { status?: string; priority?: string; category?: string; assignedTo?: string; search?: string } = {},
    pagination: { page?: number; limit?: number } = {},
    sort: { column?: string; direction?: 'asc' | 'desc' } = {}
  ) {
    // For customers, resolve customerId
    let customerId: string | undefined;
    if (!isStaff) {
      const [customer] = await db
        .select({ id: customers.id })
        .from(customers)
        .where(eq(customers.userId, userId))
        .limit(1);
      customerId = customer?.id;
      if (!customerId) return { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } };
    }

    const result = await supportRepo.listTickets(
      { ...filters, customerId },
      pagination,
      sort
    );

    // Enrich with customer names and assigned staff
    const enriched = await Promise.all(
      result.data.map(async (ticket) => {
        let customerName: string | null = null;
        let assignedName: string | null = null;

        if (ticket.customerId) {
          const [cust] = await db
            .select({ email: users.email })
            .from(customers)
            .leftJoin(users, eq(customers.userId, users.id))
            .where(eq(customers.id, ticket.customerId))
            .limit(1);
          customerName = cust?.email ?? null;
        }

        if (ticket.assignedTo) {
          const [staff] = await db
            .select({ email: users.email })
            .from(users)
            .where(eq(users.id, ticket.assignedTo))
            .limit(1);
          assignedName = staff?.email ?? null;
        }

        return { ...ticket, customerName, assignedName };
      })
    );

    return { data: enriched, meta: result.meta };
  }

  /**
   * Update a ticket (staff only for most fields).
   */
  async updateTicket(ticketId: string, userId: string, isStaff: boolean, input: UpdateTicketInput) {
    const ticket = (await supportRepo.findById(ticketId)) as TicketRow | null;
    if (!ticket) throw new SupportTicketNotFoundError(ticketId);

    // Customers can only close their own tickets
    if (!isStaff) {
      const [customer] = await db
        .select({ id: customers.id })
        .from(customers)
        .where(eq(customers.userId, userId))
        .limit(1);
      if (!customer || customer.id !== ticket.customerId) {
        throw new SupportTicketNotFoundError(ticketId);
      }
      // Customers can only close, not reassign or change priority
      if (input.status !== 'closed' || input.assignedTo !== undefined || input.priority !== undefined || input.category !== undefined) {
        throw new Error('Not authorized to make this change');
      }
    }

    const updateData: Record<string, unknown> = {};
    if (input.status) {
      updateData.status = input.status;
      if (input.status === 'resolved') updateData.resolvedAt = new Date();
      if (input.status === 'closed') updateData.closedAt = new Date();
    }
    if (input.priority !== undefined) updateData.priority = input.priority;
    if (input.category !== undefined) updateData.category = input.category;
    if (input.assignedTo !== undefined) updateData.assignedTo = input.assignedTo;
    updateData.updatedBy = userId;

    const updated = await supportRepo.updateTicket(ticketId, updateData);

    // Audit
    const changes: Record<string, { old: unknown; new: unknown }> = {};
    if (input.status) changes.status = { old: ticket.status, new: input.status };
    if (input.priority) changes.priority = { old: ticket.priority, new: input.priority };
    if (input.assignedTo !== undefined) changes.assignedTo = { old: ticket.assignedTo, new: input.assignedTo };

    await auditService.logAction({
      action: input.status === 'resolved' ? 'ticket.resolved'
        : input.status === 'closed' ? 'ticket.closed'
        : input.assignedTo !== undefined && !ticket.assignedTo && input.assignedTo ? 'ticket.assigned'
        : 'ticket.updated',
      entityType: 'support_ticket',
      entityId: ticketId,
      entityLabel: ticket.subject,
      metadata: { customerId: ticket.customerId, orderId: ticket.orderId, ...changes },
    });

    // Create notification for customer on status change
    if (input.status && ticket.customerId) {
      const [customerUser] = await db
        .select({ userId: customers.userId })
        .from(customers)
        .where(eq(customers.id, ticket.customerId))
        .limit(1);
      if (customerUser) {
        const statusLabel = input.status === 'resolved' ? 'Resolved' : input.status === 'closed' ? 'Closed' : 'Updated';
        await notificationService.dispatch({
          userId: customerUser.userId,
          type: `support.ticket_${input.status}`,
          category: 'support',
          title: `Ticket ${statusLabel}`,
          body: `Your ticket "${ticket.subject}" has been ${input.status}.`,
          link: `/account/support/${ticketId}`,
          metadata: { ticketId, status: input.status },
          eventKey: `support:ticket:${ticketId}:status:${input.status}`,
        });
      }
    }

    // Notify customer on assignment
    if (input.assignedTo && !ticket.assignedTo && ticket.customerId) {
      const [customerUser] = await db
        .select({ userId: customers.userId })
        .from(customers)
        .where(eq(customers.id, ticket.customerId))
        .limit(1);
      if (customerUser) {
        await notificationService.dispatch({
          userId: customerUser.userId,
          type: 'support.ticket_assigned',
          category: 'support',
          title: 'Ticket Assigned',
          body: `Your ticket "${ticket.subject}" has been assigned to a support agent.`,
          link: `/account/support/${ticketId}`,
          metadata: { ticketId, assignedTo: input.assignedTo },
          eventKey: `support:ticket:${ticketId}:assigned:${input.assignedTo}`,
        });
      }
    }

    return updated;
  }

  /**
   * Add a message to a ticket.
   */
  async addMessage(ticketId: string, userId: string, isStaff: boolean, input: AddMessageInput) {
    const ticket = (await supportRepo.findById(ticketId)) as TicketRow | null;
    if (!ticket) throw new SupportTicketNotFoundError(ticketId);

    // Ownership check for customers
    if (!isStaff && ticket.customerId) {
      const [customer] = await db
        .select({ id: customers.id })
        .from(customers)
        .where(eq(customers.userId, userId))
        .limit(1);
      if (!customer || customer.id !== ticket.customerId) {
        throw new SupportTicketNotFoundError(ticketId);
      }
    }

    // Customers cannot reply to closed/resolved tickets
    if (!isStaff && (ticket.status === 'closed' || ticket.status === 'resolved')) {
      throw new Error('Cannot reply to a closed or resolved ticket');
    }

    const message = await supportRepo.addMessage({
      ticketId,
      senderId: userId,
      senderType: isStaff ? 'staff' : 'customer',
      message: input.message,
      attachmentUrl: input.attachmentUrl ?? null,
      attachmentName: input.attachmentName ?? null,
    });

    // If customer replied, set status to waiting_customer for staff
    // If staff replied, set status to in_progress
    if (!isStaff && ticket.status === 'open') {
      await supportRepo.updateTicket(ticketId, { status: 'in_progress', updatedBy: userId });
    }

    // Audit
    await auditService.logAction({
      action: 'ticket.reply',
      entityType: 'support_ticket',
      entityId: ticketId,
      entityLabel: ticket.subject,
      metadata: { customerId: ticket.customerId, senderType: isStaff ? 'staff' : 'customer' },
    });

    // Notify the other party
    if (isStaff && ticket.customerId) {
      // Staff replied → notify customer
      const [customerUser] = await db
        .select({ userId: customers.userId })
        .from(customers)
        .where(eq(customers.id, ticket.customerId))
        .limit(1);
      if (customerUser) {
        await notificationService.dispatch({
          userId: customerUser.userId,
          type: 'support.staff_reply',
          category: 'support',
          title: 'Staff Replied to Your Ticket',
          body: `A support agent replied to "${ticket.subject}".`,
          link: `/account/support/${ticketId}`,
          metadata: { ticketId },
          eventKey: `support:ticket:${ticketId}:staff_reply:${message.id}`,
        });
      }
    } else if (!isStaff) {
      // Customer replied → notify staff
      const adminUsers = await db.select({ id: users.id }).from(users).where(eq(users.role, 'admin'));
      const superAdminUsers = await db.select({ id: users.id }).from(users).where(eq(users.role, 'super_admin'));
      const staffIds = [...new Set([...adminUsers.map(u => u.id), ...superAdminUsers.map(u => u.id)])];
      for (const staffId of staffIds) {
        await notificationService.dispatch({
          userId: staffId,
          type: 'support.customer_reply',
          category: 'support',
          title: 'Customer Replied to Ticket',
          body: `Customer replied to "${ticket.subject}".`,
          link: `/admin/support/${ticketId}`,
          metadata: { ticketId, customerId: ticket.customerId },
          eventKey: `support:ticket:${ticketId}:customer_reply:${message.id}`,
        });
      }
    }

    return message;
  }

  /**
   * Get unread support ticket message count for a customer.
   */
  async getUnreadCount(userId: string) {
    const [customer] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.userId, userId))
      .limit(1);
    if (!customer) return 0;

    // Count tickets with recent messages that customer hasn't seen
    // Simplified: count open/in_progress tickets as "unread" indicator
    const counts = await supportRepo.countByStatus(customer.id);
    return (counts['open'] ?? 0) + (counts['in_progress'] ?? 0) + (counts['waiting_customer'] ?? 0);
  }

  /**
   * Get status counts for admin dashboard.
   */
  async getStatusCounts() {
    return supportRepo.countByStatus();
  }
}

export const supportService = new SupportService();
