'use server';

import { requireAuth } from '@/lib/auth/session';
import { requirePermission } from '@/lib/auth/rbac';
import { supportService, createTicketSchema, updateTicketSchema, addMessageSchema } from '@/server/services/supportService';
import { SupportTicketNotFoundError } from '@/server/services/errors';
import { revalidatePath } from 'next/cache';

// ─── Customer Actions ──────────────────────────────────────────────────────

export async function createSupportTicket(data: {
  subject: string;
  description: string;
  category: string;
  priority: string;
  orderId?: string;
}) {
  const auth = await requireAuth();
  const parsed = createTicketSchema.parse(data);
  const ticket = await supportService.createTicket(auth.userId, parsed);
  revalidatePath('/account/support');
  return { success: true, ticketId: ticket.id };
}

export async function getMySupportTickets(params?: {
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  const auth = await requireAuth();
  return supportService.listTickets(
    auth.userId,
    false,
    { status: params?.status },
    { page: params?.page, limit: params?.pageSize }
  );
}

export async function getMySupportTicketDetail(ticketId: string) {
  const auth = await requireAuth();
  return supportService.getTicketDetail(ticketId, auth.userId, false);
}

export async function replyToTicket(data: { ticketId: string; message: string; attachmentUrl?: string; attachmentName?: string }) {
  const auth = await requireAuth();
  const parsed = addMessageSchema.parse(data);
  const message = await supportService.addMessage(data.ticketId, auth.userId, false, parsed);
  revalidatePath(`/account/support/${data.ticketId}`);
  return { success: true, messageId: message.id };
}

export async function closeMyTicket(ticketId: string) {
  const auth = await requireAuth();
  await supportService.updateTicket(ticketId, auth.userId, false, { status: 'closed' });
  revalidatePath('/account/support');
  revalidatePath(`/account/support/${ticketId}`);
  return { success: true };
}

// ─── Admin Actions ─────────────────────────────────────────────────────────

export async function listSupportTicketsAdmin(params?: {
  status?: string;
  priority?: string;
  category?: string;
  assignedTo?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
}) {
  const auth = await requireAuth();
  await requirePermission(auth, 'support.read');
  return supportService.listTickets(
    auth.userId,
    true,
    { status: params?.status, priority: params?.priority, category: params?.category, assignedTo: params?.assignedTo, search: params?.search },
    { page: params?.page, limit: params?.pageSize },
    { column: params?.sortColumn, direction: params?.sortDirection }
  );
}

export async function getSupportTicketDetailAdmin(ticketId: string) {
  const auth = await requireAuth();
  await requirePermission(auth, 'support.read');
  return supportService.getTicketDetail(ticketId, auth.userId, true);
}

export async function updateSupportTicketAdmin(data: {
  ticketId: string;
  status?: string;
  priority?: string;
  category?: string;
  assignedTo?: string | null;
}) {
  const auth = await requireAuth();
  await requirePermission(auth, 'support.update');
  const parsed = updateTicketSchema.parse(data);
  await supportService.updateTicket(data.ticketId, auth.userId, true, parsed);
  revalidatePath('/admin/support');
  revalidatePath(`/admin/support/${data.ticketId}`);
  return { success: true };
}

export async function replyToTicketAdmin(data: { ticketId: string; message: string; attachmentUrl?: string; attachmentName?: string }) {
  const auth = await requireAuth();
  await requirePermission(auth, 'support.reply');
  const parsed = addMessageSchema.parse(data);
  const message = await supportService.addMessage(data.ticketId, auth.userId, true, parsed);
  revalidatePath(`/admin/support/${data.ticketId}`);
  return { success: true, messageId: message.id };
}

export async function getSupportStatusCounts() {
  const auth = await requireAuth();
  await requirePermission(auth, 'support.read');
  return supportService.getStatusCounts();
}
