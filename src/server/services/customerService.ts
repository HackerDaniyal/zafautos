import { CustomerRepository } from '@/server/repositories';
import { z } from 'zod';
import { CustomerNotFoundError, ValidationError } from './errors';

// ─────────────────────────────────────────────
// Validation Schemas
// ─────────────────────────────────────────────

export const CreateAddressSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID'),
  addressLine1: z.string().min(1, 'Address line 1 is required'),
  addressLine2: z.string().optional().nullable(),
  city: z.string().min(1, 'City is required'),
  state: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  countryId: z.string().uuid('Invalid country ID'),
  isDefault: z.boolean().default(false),
});
export type CreateAddressDTO = z.infer<typeof CreateAddressSchema>;

export const CreateAlertSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID'),
  criteria: z.record(z.unknown()), // Store JSON search criteria
  isActive: z.boolean().default(true),
});
export type CreateAlertDTO = z.infer<typeof CreateAlertSchema>;

export const UpdateSettingsSchema = z.object({
  currencyId: z.string().uuid('Invalid currency ID').optional().nullable(),
  languageId: z.string().uuid('Invalid language ID').optional().nullable(),
  emailNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
});
export type UpdateSettingsDTO = z.infer<typeof UpdateSettingsSchema>;

// ─────────────────────────────────────────────
// Service Layer
// ─────────────────────────────────────────────

export class CustomerService {
  constructor(private readonly customerRepo: CustomerRepository = new CustomerRepository()) {}

  /**
   * Retrieves a customer profile by their user ID.
   */
  async getCustomerByUserId(userId: string) {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    const customer = await this.customerRepo.findByUserId(userId);
    if (!customer) {
      throw new CustomerNotFoundError(userId);
    }
    return customer;
  }

  /**
   * Retrieves a customer's wishlist.
   */
  async getWishlist(customerId: string) {
    if (!customerId) {
      throw new ValidationError('Customer ID is required');
    }
    return this.customerRepo.getWishlist(customerId);
  }

  /**
   * Adds a vehicle to a customer's wishlist.
   */
  async addToWishlist(customerId: string, vehicleId: string) {
    if (!customerId || !vehicleId) {
      throw new ValidationError('Customer ID and Vehicle ID are required');
    }
    return this.customerRepo.addWishlistEntry(customerId, vehicleId);
  }

  /**
   * Removes a vehicle from a customer's wishlist.
   */
  async removeFromWishlist(customerId: string, vehicleId: string) {
    if (!customerId || !vehicleId) {
      throw new ValidationError('Customer ID and Vehicle ID are required');
    }
    return this.customerRepo.removeWishlistEntry(customerId, vehicleId);
  }

  /**
   * Retrieves all addresses for a customer.
   */
  async getAddresses(customerId: string) {
    if (!customerId) {
      throw new ValidationError('Customer ID is required');
    }
    return this.customerRepo.getAddresses(customerId);
  }

  /**
   * Creates a new address for a customer.
   */
  async createAddress(data: CreateAddressDTO) {
    const validatedData = CreateAddressSchema.parse(data);
    return this.customerRepo.createAddress(validatedData as unknown as Parameters<typeof this.customerRepo.createAddress>[0]);
  }

  /**
   * Creates a search alert for a customer.
   */
  async createAlert(data: CreateAlertDTO) {
    const validatedData = CreateAlertSchema.parse(data);
    return this.customerRepo.createAlert(validatedData as unknown as Parameters<typeof this.customerRepo.createAlert>[0]);
  }

  /**
   * Updates customer settings/preferences.
   */
  async updateSettings(customerId: string, data: UpdateSettingsDTO) {
    if (!customerId) {
      throw new ValidationError('Customer ID is required');
    }

    const validatedData = UpdateSettingsSchema.parse(data);
    
    const updated = await this.customerRepo.updateSettings(
      customerId, 
      validatedData as unknown as Parameters<typeof this.customerRepo.updateSettings>[1]
    );

    if (!updated) {
      throw new CustomerNotFoundError(customerId);
    }

    return updated;
  }
}
