import {
    featuredVehicles,
    vehicleCompare,
    vehicleEnquiries,
    vehicleViews,
    vehicleWishlist,
} from '@/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { BaseRepository } from './baseRepository';

export class MarketplaceRepository {
  public readonly featuredVehicles = new BaseRepository(featuredVehicles);
  public readonly views = new BaseRepository(vehicleViews);
  public readonly compare = new BaseRepository(vehicleCompare);
  public readonly wishlist = new BaseRepository(vehicleWishlist);
  public readonly enquiries = new BaseRepository(vehicleEnquiries);

  async findFeatured() {
    return this.featuredVehicles.findAll();
  }

  async recordView(vehicleId: string, userId?: string | null) {
    return this.views.create({ vehicleId, userId: userId ?? undefined });
  }

  async getWishlistForUser(userId: string) {
    return this.wishlist.getClient()
      .select()
      .from(vehicleWishlist)
      .where(eq(vehicleWishlist.userId, userId));
  }

  async addToWishlist(userId: string, vehicleId: string) {
    return this.wishlist.create({ userId, vehicleId });
  }

  async removeFromWishlist(userId: string, vehicleId: string) {
    return this.wishlist.getClient()
      .delete(vehicleWishlist)
      .where(
        and(eq(vehicleWishlist.userId, userId), eq(vehicleWishlist.vehicleId, vehicleId)),
      );
  }

  async addComparisonEntry(userId: string, vehicleId: string) {
    return this.compare.create({ userId, vehicleId });
  }

  async submitEnquiry(data: Parameters<typeof this.enquiries.create>[0]) {
    return this.enquiries.create(data);
  }
}
