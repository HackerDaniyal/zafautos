import { DealerRepository } from '@/server/repositories';
import { users } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { DealerNotFoundError, ValidationError } from './errors';
import { isValidDealerTransition, type DealerStatus } from '@/lib/types/dealer';

// ──────────────────────────────────────────────────────────────
// Validation Schemas
// ──────────────────────────────────────────────────────────────

export const AssignOrderSchema = z.object({
  dealerId: z.string().uuid('Invalid dealer ID'),
  orderId: z.string().uuid('Invalid order ID'),
});
export type AssignOrderDTO = z.infer<typeof AssignOrderSchema>;

export const LogActivitySchema = z.object({
  dealerId: z.string().uuid('Invalid dealer ID'),
  activity: z.string().min(1, 'Activity is required'),
});
export type LogActivityDTO = z.infer<typeof LogActivitySchema>;

// ──────────────────────────────────────────────────────────────
// Service Layer
// ──────────────────────────────────────────────────────────────

export class DealerService {
  constructor(private readonly dealerRepo: DealerRepository = new DealerRepository()) {}

  async getDealerByUserId(userId: string) {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    const dealer = await this.dealerRepo.findByUserId(userId);
    if (!dealer) {
      throw new DealerNotFoundError(userId);
    }
    return dealer;
  }

  async getDealerForEdit(dealerId: string) {
    if (!dealerId) {
      throw new ValidationError('Dealer ID is required');
    }
    const result = await this.dealerRepo.getDealerForEdit(dealerId);
    if (!result) {
      throw new DealerNotFoundError(dealerId);
    }
    return result;
  }

  async listDealers(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    countryId?: string;
    dateFrom?: string;
    dateTo?: string;
    hasOrders?: boolean;
    sortColumn?: string;
    sortDirection?: 'asc' | 'desc';
  } = {}) {
    return this.dealerRepo.listDealers(params);
  }

  async getDealerDetail(dealerId: string) {
    if (!dealerId) {
      throw new ValidationError('Dealer ID is required');
    }

    const dealer = await this.dealerRepo.getDealerWithDetails(dealerId);
    if (!dealer) {
      throw new DealerNotFoundError(dealerId);
    }
    return dealer;
  }

  async getDealerStats() {
    return this.dealerRepo.getDealerStats();
  }

  async changeDealerStatus(
    dealerId: string,
    newStatus: DealerStatus,
    userId?: string,
    _note?: string,
  ) {
    if (!dealerId) {
      throw new ValidationError('Dealer ID is required');
    }

    const dealer = await this.dealerRepo.dealers.findById(dealerId) as unknown as { id: string; userId: string } | null;
    if (!dealer) {
      throw new DealerNotFoundError(dealerId);
    }

    const userResult = await this.dealerRepo.dealers.getClient()
      .select({ id: users.id, status: users.status })
      .from(users)
      .where(eq(users.id, dealer.userId))
      .limit(1);

    const user = userResult[0] as { status: string } | undefined;
    const currentStatus = (user?.status ?? 'active') as DealerStatus;

    if (!isValidDealerTransition(currentStatus, newStatus)) {
      throw new ValidationError(`Invalid status transition: ${currentStatus} → ${newStatus}`);
    }

    await this.dealerRepo.updateUserStatus(dealer.userId, newStatus);
    return { success: true };
  }

  async softDeleteDealer(dealerId: string, userId?: string) {
    if (!dealerId) {
      throw new ValidationError('Dealer ID is required');
    }

    const dealer = await this.dealerRepo.dealers.findById(dealerId) as unknown as { deletedAt: Date | null } | null;
    if (!dealer) {
      throw new DealerNotFoundError(dealerId);
    }

    if (dealer.deletedAt) {
      throw new ValidationError('Dealer is already deleted');
    }

    return this.dealerRepo.softDeleteDealer(dealerId, userId);
  }

  async restoreDealer(dealerId: string) {
    if (!dealerId) {
      throw new ValidationError('Dealer ID is required');
    }

    const dealer = await this.dealerRepo.dealers.findById(dealerId) as unknown as { deletedAt: Date | null } | null;
    if (!dealer) {
      throw new DealerNotFoundError(dealerId);
    }

    if (!dealer.deletedAt) {
      throw new ValidationError('Dealer is not deleted');
    }

    return this.dealerRepo.restoreDealer(dealerId);
  }

  async bulkUpdateStatus(ids: string[], status: DealerStatus, userId?: string) {
    const results = [];
    for (const id of ids) {
      try {
        await this.changeDealerStatus(id, status, userId);
        results.push({ id, success: true });
      } catch (error) {
        results.push({
          id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
    return results;
  }

  async bulkDelete(ids: string[], userId?: string) {
    const results = [];
    for (const id of ids) {
      try {
        await this.softDeleteDealer(id, userId);
        results.push({ id, success: true });
      } catch (error) {
        results.push({
          id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
    return results;
  }

  async assignOrder(data: AssignOrderDTO) {
    const validatedData = AssignOrderSchema.parse(data);
    return this.dealerRepo.assignOrder({
      dealerId: validatedData.dealerId,
      orderId: validatedData.orderId,
    });
  }

  async getAssignments(dealerId: string) {
    if (!dealerId) {
      throw new ValidationError('Dealer ID is required');
    }
    return this.dealerRepo.getAssignments(dealerId);
  }

  async logActivity(data: LogActivityDTO) {
    const validatedData = LogActivitySchema.parse(data);
    return this.dealerRepo.logActivity({
      dealerId: validatedData.dealerId,
      activity: validatedData.activity,
    });
  }

  async upsertProfile(dealerId: string, data: { displayName?: string | null }) {
    if (!dealerId) {
      throw new ValidationError('Dealer ID is required');
    }

    const existing = await this.dealerRepo.profiles.findById(dealerId);
    if (existing) {
      return this.dealerRepo.profiles.update(dealerId, {
        displayName: data.displayName,
        updatedAt: new Date(),
      } as never);
    }

    return this.dealerRepo.profiles.create({
      dealerId,
      displayName: data.displayName ?? null,
    } as never);
  }
}
