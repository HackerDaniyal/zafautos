import {
    customerAddresses,
    customerAlerts,
    customerProfiles,
    customers,
    customerSettings,
    customerWishlist,
} from '@/server/db/schema';
import { type InferModel, and, eq } from 'drizzle-orm';
import { BaseRepository } from './baseRepository';

export class CustomerRepository {
  public readonly customers = new BaseRepository(customers);
  public readonly addresses = new BaseRepository(customerAddresses);
  public readonly alerts = new BaseRepository(customerAlerts);
  public readonly profiles = new BaseRepository(customerProfiles);
  public readonly settings = new BaseRepository(customerSettings);
  public readonly wishlist = new BaseRepository(customerWishlist);

  async findByUserId(userId: string) {
    const [customer] = await this.customers.getClient()
      .select()
      .from(customers)
      .where(eq(customers.userId, userId))
      .limit(1);

    return customer ?? null;
  }

  async getWishlist(customerId: string) {
    return this.wishlist.getClient()
      .select()
      .from(customerWishlist)
      .where(eq(customerWishlist.customerId, customerId));
  }

  async addWishlistEntry(customerId: string, vehicleId: string) {
    return this.wishlist.create({ customerId, vehicleId });
  }

  async removeWishlistEntry(customerId: string, vehicleId: string) {
    return this.wishlist.getClient()
      .delete(customerWishlist)
      .where(
        and(
          eq(customerWishlist.customerId, customerId),
          eq(customerWishlist.vehicleId, vehicleId),
        ),
      );
  }

  async getAddresses(customerId: string) {
    return this.addresses.getClient()
      .select()
      .from(customerAddresses)
      .where(eq(customerAddresses.customerId, customerId));
  }

  async createAddress(data: InferModel<typeof customerAddresses, 'insert'>) {
    return this.addresses.create(data);
  }

  async createAlert(data: InferModel<typeof customerAlerts, 'insert'>) {
    return this.alerts.create(data);
  }

  async updateSettings(customerId: string, data: Partial<InferModel<typeof customerSettings, 'insert'>>) {
    const [settings] = await this.settings.getClient()
      .update(customerSettings)
      .set(data)
      .where(eq(customerSettings.customerId, customerId))
      .returning();

    return settings ?? null;
  }
}
