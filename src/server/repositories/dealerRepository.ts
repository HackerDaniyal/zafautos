import { dealerActivity, dealerAssignments, dealerProfiles, dealers } from '@/server/db/schema';
import type { InferModel } from 'drizzle-orm';
import { eq } from 'drizzle-orm';
import { BaseRepository } from './baseRepository';

export class DealerRepository {
  public readonly dealers = new BaseRepository(dealers);
  public readonly profiles = new BaseRepository(dealerProfiles);
  public readonly assignments = new BaseRepository(dealerAssignments);
  public readonly activity = new BaseRepository(dealerActivity);

  async findByUserId(userId: string) {
    const [dealer] = await this.dealers.getClient()
      .select()
      .from(dealers)
      .where(eq(dealers.userId, userId))
      .limit(1);

    return dealer ?? null;
  }

  async assignOrder(data: InferModel<typeof dealerAssignments, 'insert'>) {
    return this.assignments.create(data);
  }

  async getAssignments(dealerId: string) {
    return this.assignments.getClient()
      .select()
      .from(dealerAssignments)
      .where(eq(dealerAssignments.dealerId, dealerId));
  }

  async logActivity(data: InferModel<typeof dealerActivity, 'insert'>) {
    return this.activity.create(data);
  }
}
