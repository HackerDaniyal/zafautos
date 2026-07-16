import { vehicles } from '@/server/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { BaseRepository } from './baseRepository';

export class VehicleRepository extends BaseRepository<typeof vehicles> {
  constructor() {
    super(vehicles);
  }

  async findBySlug(slug: string) {
    const [vehicle] = await this.getClient()
      .select()
      .from(vehicles)
      .where(eq(vehicles.slug, slug))
      .limit(1);

    return vehicle ?? null;
  }

  async findActive() {
    return this.getClient()
      .select()
      .from(vehicles)
      .where(eq(vehicles.status, 'active'));
  }

  async findByIds(ids: string[]) {
    return this.getClient()
      .select()
      .from(vehicles)
      .where(inArray(vehicles.id, ids));
  }
}
