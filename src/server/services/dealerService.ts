import { DealerRepository } from '@/server/repositories';
import { z } from 'zod';
import { DealerNotFoundError, ValidationError } from './errors';

// ─────────────────────────────────────────────
// Validation Schemas
// ─────────────────────────────────────────────

export const AssignOrderSchema = z.object({
  dealerId: z.string().uuid('Invalid dealer ID'),
  orderId: z.string().uuid('Invalid order ID'),
  commissionAmount: z.number().int().nonnegative().default(0),
});
export type AssignOrderDTO = z.infer<typeof AssignOrderSchema>;

export const LogActivitySchema = z.object({
  dealerId: z.string().uuid('Invalid dealer ID'),
  action: z.string().min(1, 'Action is required'),
  details: z.record(z.unknown()).optional(),
});
export type LogActivityDTO = z.infer<typeof LogActivitySchema>;

// ─────────────────────────────────────────────
// Service Layer
// ─────────────────────────────────────────────

export class DealerService {
  constructor(private readonly dealerRepo: DealerRepository = new DealerRepository()) {}

  /**
   * Retrieves a dealer profile by their user ID.
   */
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

  /**
   * Retrieves all order assignments for a dealer.
   */
  async getAssignments(dealerId: string) {
    if (!dealerId) {
      throw new ValidationError('Dealer ID is required');
    }
    return this.dealerRepo.getAssignments(dealerId);
  }

  /**
   * Assigns an order to a dealer.
   */
  async assignOrder(data: AssignOrderDTO) {
    const validatedData = AssignOrderSchema.parse(data);
    return this.dealerRepo.assignOrder(validatedData as unknown as Parameters<typeof this.dealerRepo.assignOrder>[0]);
  }

  /**
   * Logs an activity performed by a dealer.
   */
  async logActivity(data: LogActivityDTO) {
    const validatedData = LogActivitySchema.parse(data);
    return this.dealerRepo.logActivity(validatedData as unknown as Parameters<typeof this.dealerRepo.logActivity>[0]);
  }
}
