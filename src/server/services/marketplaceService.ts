import { MarketplaceRepository } from '@/server/repositories';
import { z } from 'zod';
import { ValidationError } from './errors';

// ─────────────────────────────────────────────
// Validation Schemas
// ─────────────────────────────────────────────

export const SubmitEnquirySchema = z.object({
  vehicleId: z.string().uuid('Invalid vehicle ID'),
  userId: z.string().uuid('Invalid user ID').optional(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  message: z.string().min(1, 'Message is required'),
});
export type SubmitEnquiryDTO = z.infer<typeof SubmitEnquirySchema>;

// ─────────────────────────────────────────────
// Service Layer
// ─────────────────────────────────────────────

export class MarketplaceService {
  constructor(private readonly marketplaceRepo: MarketplaceRepository = new MarketplaceRepository()) {}

  /**
   * Retrieves featured vehicles for the marketplace homepage.
   */
  async getFeaturedVehicles() {
    return this.marketplaceRepo.findFeatured();
  }

  /**
   * Records a view for a vehicle.
   */
  async recordVehicleView(vehicleId: string, userId?: string) {
    if (!vehicleId) {
      throw new ValidationError('Vehicle ID is required');
    }
    return this.marketplaceRepo.recordView(vehicleId, userId);
  }

  /**
   * Retrieves a user's wishlist.
   */
  async getWishlist(userId: string) {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }
    return this.marketplaceRepo.getWishlistForUser(userId);
  }

  /**
   * Adds a vehicle to a user's wishlist.
   */
  async addToWishlist(userId: string, vehicleId: string) {
    if (!userId || !vehicleId) {
      throw new ValidationError('User ID and Vehicle ID are required');
    }
    return this.marketplaceRepo.addToWishlist(userId, vehicleId);
  }

  /**
   * Removes a vehicle from a user's wishlist.
   */
  async removeFromWishlist(userId: string, vehicleId: string) {
    if (!userId || !vehicleId) {
      throw new ValidationError('User ID and Vehicle ID are required');
    }
    return this.marketplaceRepo.removeFromWishlist(userId, vehicleId);
  }

  /**
   * Adds a vehicle to a user's comparison list.
   */
  async addToComparison(userId: string, vehicleId: string) {
    if (!userId || !vehicleId) {
      throw new ValidationError('User ID and Vehicle ID are required');
    }
    return this.marketplaceRepo.addComparisonEntry(userId, vehicleId);
  }

  /**
   * Submits an enquiry about a vehicle.
   */
  async submitEnquiry(data: SubmitEnquiryDTO) {
    const validatedData = SubmitEnquirySchema.parse(data);
    return this.marketplaceRepo.submitEnquiry(validatedData as unknown as Parameters<typeof this.marketplaceRepo.submitEnquiry>[0]);
  }
}
